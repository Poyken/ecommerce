/**
 * =====================================================================
 * LOYALTY SERVICE - HỆ THỐNG ĐIỂM THƯỞNG & CHĂM SÓC KHÁCH HÀNG
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * Module này quản lý "Loyalty Points" (Điểm thành viên) của người dùng.
 * Giống như thẻ tích điểm tại các siêu thị.
 *
 * 1. CƠ CHẾ HOẠT ĐỘNG:
 *    - EARNED (Tích điểm): Thường diễn ra sau khi đơn hàng COMPLETED. Công thức là 1% giá trị đơn.
 *    - REDEEMED (Tiêu điểm): Người dùng dùng điểm để trừ tiền khi mua hàng mới.
 *    - REFUNDED (Hoàn điểm): Khi đơn hàng bị hủy, nếu người dùng đã tiêu điểm cho đơn đó -> phải trả lại điểm cho họ.
 *
 * 2. TÍNH NHẤT QUÁN (Consistency):
 *    - Điểm được lưu theo dạng "Transaction Log" vào bảng LoyaltyPoint (mỗi biến động là 1 dòng).
 *    - Số dư thực tế được tính bằng hàm SUM(amount). Cách làm này giúp truy vết (Audit) cực tốt.
 *
 * 3. IDEMPOTENCY (Tính ổn định):
 *    - Tránh việc tích điểm 2 lần cho cùng 1 đơn hàng (hàm earnPointsFromOrder có check existingPoints).
 * =====================================================================
 */

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@/core/prisma/prisma.service';
import {
  EarnPointsDto,
  RedeemPointsDto,
  RefundPointsDto,
  LoyaltyPointType,
} from './dto/loyalty.dto';
import { EmailService } from '@/integrations/email/email.service';

@Injectable()
export class LoyaltyService {
  private readonly logger = new Logger(LoyaltyService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  // =====================================================================
  // TÍCH ĐIỂM (EARN POINTS)
  // =====================================================================

  async earnPoints(tenantId: string, dto: EarnPointsDto) {
    if (dto.amount <= 0) {
      throw new BadRequestException('Số điểm tích lũy phải là số dương');
    }

    return (this.prisma as any).loyaltyPoint.create({
      data: {
        userId: dto.userId,
        orderId: dto.orderId,
        amount: dto.amount,
        type: LoyaltyPointType.EARNED,
        reason: dto.reason || 'Tích điểm từ đơn hàng',
        tenantId,
      },
    });
  }

  // Tự động tích điểm khi đơn hàng hoàn thành
  async earnPointsFromOrder(tenantId: string, orderId: string) {
    return this.prisma.$transaction(async (tx) => {
      const order = await (tx as any).order.findUnique({
        where: { id: orderId, tenantId },
      });

      if (!order) {
        throw new NotFoundException('Không tìm thấy đơn hàng');
      }

      // Idempotency: Kiểm tra xem đơn hàng này đã được tích điểm chưa
      const existingPoints = await (tx as any).loyaltyPoint.findFirst({
        where: { orderId, type: LoyaltyPointType.EARNED },
      });

      if (existingPoints) {
        this.logger.warn(`Order ${orderId} already earned points. Skipping.`);
        return existingPoints;
      }

      // 1. Lấy cấu hình Loyalty của Tenant
      const settings = await (tx as any).tenantSettings.findUnique({
        where: { tenantId },
      });

      // 2. Nếu Loyalty bị tắt, không làm gì cả
      if (settings && !settings.isLoyaltyEnabled) {
        this.logger.log(`Loyalty is disabled for tenant ${tenantId}.`);
        return null;
      }

      // 3. Tính điểm: Sử dụng tỷ lệ từ cấu hình (mặc định 1000đ = 1 điểm)
      const ratio = settings ? Number(settings.loyaltyPointRatio) : 1000;
      const pointsToEarn = Math.floor(Number(order.totalAmount) / ratio);

      if (pointsToEarn <= 0) {
        return null; // Không đủ để tích điểm
      }

      const loyaltyPoint = await (tx as any).loyaltyPoint.create({
        data: {
          userId: order.userId,
          orderId,
          amount: pointsToEarn,
          type: LoyaltyPointType.EARNED as any,
          reason: `Tích điểm từ đơn hàng #${orderId.slice(0, 8)}`,
          tenantId,
        },
      });

      // Gửi email thông báo tích điểm thành công
      try {
        const user = await (this.prisma.user as any).findUnique({
          where: { id: order.userId },
          select: { email: true, firstName: true },
        });

        if (user?.email) {
          await this.emailService.sendLoyaltyPointsEarned(
            user.email,
            user.firstName || 'Quý khách',
            pointsToEarn,
            orderId,
          );
        }
      } catch (emailError) {
        this.logger.error(
          `Lỗi gửi email thông báo tích điểm: ${emailError.message}`,
        );
      }

      return loyaltyPoint;
    });
  }

  // =====================================================================
  // TIÊU ĐIỂM (REDEEM POINTS)
  // =====================================================================

  async redeemPoints(tenantId: string, dto: RedeemPointsDto) {
    if (dto.amount <= 0) {
      throw new BadRequestException('Số điểm muốn tiêu phải là số dương');
    }

    // Kiểm tra số dư điểm
    const balance = await this.getUserPointBalance(tenantId, dto.userId);
    if (balance < dto.amount) {
      throw new BadRequestException(
        `Số dư điểm không đủ. Số dư hiện tại: ${balance}`,
      );
    }

    return (this.prisma as any).loyaltyPoint.create({
      data: {
        userId: dto.userId,
        orderId: dto.orderId,
        amount: -dto.amount, // Số âm cho tiêu điểm
        type: LoyaltyPointType.REDEEMED,
        reason: dto.reason || 'Tiêu điểm thanh toán',
        tenantId,
      },
    });
  }

  // =====================================================================
  // HOÀN ĐIỂM (REFUND POINTS)
  // =====================================================================

  async refundPoints(tenantId: string, dto: RefundPointsDto) {
    return (this.prisma as any).loyaltyPoint.create({
      data: {
        userId: dto.userId,
        orderId: dto.orderId,
        amount: dto.amount, // Hoàn lại điểm đã tiêu
        type: LoyaltyPointType.REFUNDED,
        reason: dto.reason || 'Hoàn điểm do hủy đơn',
        tenantId,
      },
    });
  }

  // =====================================================================
  // TRUY VẤN ĐIỂM
  // =====================================================================

  async getUserPointBalance(tenantId: string, userId: string): Promise<number> {
    const result = await (this.prisma as any).loyaltyPoint.aggregate({
      where: { userId, tenantId },
      _sum: { amount: true },
    });

    return result._sum.amount || 0;
  }

  async getUserPointHistory(tenantId: string, userId: string) {
    return (this.prisma as any).loyaltyPoint.findMany({
      where: { userId, tenantId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async getOrderPoints(tenantId: string, orderId: string) {
    return (this.prisma as any).loyaltyPoint.findMany({
      where: { orderId, tenantId },
      orderBy: { createdAt: 'asc' },
    });
  }
}
