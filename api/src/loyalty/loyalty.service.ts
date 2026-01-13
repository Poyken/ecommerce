import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@/core/prisma/prisma.service';
import { LoyaltyPointType } from '@prisma/client';
import {
  EarnPointsDto,
  RedeemPointsDto,
  RefundPointsDto,
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
      throw new BadRequestException('Amount must be positive');
    }

    return this.prisma.loyaltyPoint.create({
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

  // Tự động tích điểm khi đơn hàng hoàn thành (1% tổng giá trị = 1 điểm cho mỗi 1000đ)
  async earnPointsFromOrder(tenantId: string, orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId, tenantId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Idempotency: Kiểm tra xem đơn hàng này đã được tích điểm chưa
    const existingPoints = await this.prisma.loyaltyPoint.findFirst({
      where: { orderId, type: LoyaltyPointType.EARNED },
    });

    if (existingPoints) {
      this.logger.warn(`Order ${orderId} already earned points. Skipping.`);
      return existingPoints;
    }

    // Tính điểm: 1 điểm cho mỗi 10.000đ
    const pointsToEarn = Math.floor(Number(order.totalAmount) / 10000);

    if (pointsToEarn <= 0) {
      return null; // Không đủ để tích điểm
    }

    const loyaltyPoint = await this.prisma.loyaltyPoint.create({
      data: {
        userId: order.userId,
        orderId,
        amount: pointsToEarn,
        type: LoyaltyPointType.EARNED,
        reason: `Tích điểm từ đơn hàng #${orderId.slice(0, 8)}`,
        tenantId,
      },
    });

    // Gửi email thông báo tích điểm thành công
    try {
      const user = await this.prisma.user.findUnique({
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
  }

  // =====================================================================
  // TIÊU ĐIỂM (REDEEM POINTS)
  // =====================================================================

  async redeemPoints(tenantId: string, dto: RedeemPointsDto) {
    if (dto.amount <= 0) {
      throw new BadRequestException('Amount must be positive');
    }

    // Kiểm tra số dư điểm
    const balance = await this.getUserPointBalance(tenantId, dto.userId);
    if (balance < dto.amount) {
      throw new BadRequestException(
        `Insufficient points. Current balance: ${balance}`,
      );
    }

    return this.prisma.loyaltyPoint.create({
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
    return this.prisma.loyaltyPoint.create({
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
    const result = await this.prisma.loyaltyPoint.aggregate({
      where: { userId, tenantId },
      _sum: { amount: true },
    });

    return result._sum.amount || 0;
  }

  async getUserPointHistory(tenantId: string, userId: string) {
    return this.prisma.loyaltyPoint.findMany({
      where: { userId, tenantId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async getOrderPoints(tenantId: string, orderId: string) {
    return this.prisma.loyaltyPoint.findMany({
      where: { orderId, tenantId },
      orderBy: { createdAt: 'asc' },
    });
  }
}
