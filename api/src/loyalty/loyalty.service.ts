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
 *    - EARNED (Tích điểm): Thường diễn ra sau khi đơn hàng COMPLETED.
 *    - REDEEMED (Tiêu điểm): Người dùng dùng điểm để trừ tiền khi mua hàng.
 *    - REFUNDED (Hoàn điểm): Khi đơn hàng bị hủy/trả hàng.
 *
 * 2. QUY TẮC TÍCH ĐIỂM:
 *    - Mặc định: 1 điểm cho mỗi 10,000đ chi tiêu
 *    - Điểm hết hạn sau 365 ngày
 *    - 1 điểm = 1,000đ khi thanh toán
 *
 * 3. TÍNH NHẤT QUÁN (Consistency):
 *    - Điểm được lưu theo dạng "Transaction Log" vào bảng LoyaltyPoint
 *    - Số dư thực tế được tính bằng SUM(amount)
 *
 * 4. IDEMPOTENCY:
 *    - Tránh việc tích điểm 2 lần cho cùng 1 đơn hàng
 *
 * =====================================================================
 */

import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@/core/prisma/prisma.service';
<<<<<<< HEAD
import { LoyaltyPointType, Prisma } from '@prisma/client';
=======
>>>>>>> af947ce73e8cad2354fd505f245c0f7cd9bf7457
import {
  EarnPointsDto,
  RedeemPointsDto,
  RefundPointsDto,
  LoyaltyPointType,
} from './dto/loyalty.dto';
import { EmailService } from '@/integrations/email/email.service';

// Configuration - có thể move ra Settings/Config sau
const LOYALTY_CONFIG = {
  POINTS_PER_AMOUNT: 10000, // Mỗi 10,000đ = 1 điểm
  POINT_VALUE: 1000, // 1 điểm = 1,000đ
  EXPIRY_DAYS: 365, // Điểm hết hạn sau 365 ngày
  MIN_REDEEM_POINTS: 10, // Tối thiểu 10 điểm mới được dùng
  MAX_REDEEM_PERCENT: 50, // Tối đa 50% giá trị đơn hàng
};

export interface LoyaltySummary {
  balance: number;
  totalEarned: number;
  totalRedeemed: number;
  expiringPoints: number;
  expiringDate: Date | null;
  pointValue: number;
}

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

  /**
   * Tích điểm thủ công (Admin action)
   */
  async earnPoints(tenantId: string, dto: EarnPointsDto) {
    if (dto.amount <= 0) {
      throw new BadRequestException('Số điểm tích lũy phải là số dương');
    }

<<<<<<< HEAD
    // Tính ngày hết hạn
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + LOYALTY_CONFIG.EXPIRY_DAYS);

    const point = await this.prisma.loyaltyPoint.create({
=======
    return (this.prisma as any).loyaltyPoint.create({
>>>>>>> af947ce73e8cad2354fd505f245c0f7cd9bf7457
      data: {
        userId: dto.userId,
        orderId: dto.orderId,
        amount: dto.amount,
        type: LoyaltyPointType.EARNED,
        reason: dto.reason || 'Tích điểm thủ công',
        expiresAt,
        tenantId,
      },
    });

    this.logger.log(`User ${dto.userId} earned ${dto.amount} points`);
    return point;
  }

<<<<<<< HEAD
  /**
   * Tự động tích điểm khi đơn hàng hoàn thành
   */
  async earnPointsFromOrder(tenantId: string, orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId, tenantId },
      include: {
        user: { select: { id: true, email: true, firstName: true } },
      },
    });

    if (!order) {
      throw new NotFoundException('Không tìm thấy đơn hàng');
    }

    // Idempotency: Kiểm tra xem đơn hàng này đã được tích điểm chưa
    const existingPoints = await this.prisma.loyaltyPoint.findFirst({
      where: { orderId, type: LoyaltyPointType.EARNED },
    });

    if (existingPoints) {
      this.logger.warn(`Order ${orderId} already earned points. Skipping.`);
      return existingPoints;
    }

    // Tính điểm
    const pointsToEarn = Math.floor(
      Number(order.totalAmount) / LOYALTY_CONFIG.POINTS_PER_AMOUNT,
    );

    if (pointsToEarn <= 0) {
      this.logger.log(`Order ${orderId} value too low for points`);
      return null;
    }

    // Tính ngày hết hạn
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + LOYALTY_CONFIG.EXPIRY_DAYS);

    const loyaltyPoint = await this.prisma.loyaltyPoint.create({
      data: {
        userId: order.userId,
        orderId,
        amount: pointsToEarn,
        type: LoyaltyPointType.EARNED,
        reason: `Tích điểm từ đơn hàng #${orderId.slice(0, 8)}`,
        expiresAt,
        tenantId,
      },
    });

    // Gửi email thông báo
    try {
      if (order.user?.email) {
        await this.emailService.sendLoyaltyPointsEarned(
          order.user.email,
          order.user.firstName || 'Quý khách',
          pointsToEarn,
=======
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
>>>>>>> af947ce73e8cad2354fd505f245c0f7cd9bf7457
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

<<<<<<< HEAD
    this.logger.log(
      `User ${order.userId} earned ${pointsToEarn} points from order ${orderId}`,
    );
    return loyaltyPoint;
=======
      return loyaltyPoint;
    });
>>>>>>> af947ce73e8cad2354fd505f245c0f7cd9bf7457
  }

  // =====================================================================
  // TIÊU ĐIỂM (REDEEM POINTS)
  // =====================================================================

  /**
   * Tiêu điểm khi thanh toán
   */
  async redeemPoints(tenantId: string, dto: RedeemPointsDto) {
    if (dto.amount <= 0) {
      throw new BadRequestException('Số điểm muốn tiêu phải là số dương');
    }

    if (dto.amount < LOYALTY_CONFIG.MIN_REDEEM_POINTS) {
      throw new BadRequestException(
        `Tối thiểu ${LOYALTY_CONFIG.MIN_REDEEM_POINTS} điểm mới được sử dụng`,
      );
    }

<<<<<<< HEAD
    // Kiểm tra số dư điểm (chỉ tính điểm còn hiệu lực)
    const balance = await this.getAvailableBalance(tenantId, dto.userId);
    if (balance < dto.amount) {
      throw new BadRequestException(
        `Số dư điểm không đủ. Số dư hiện tại: ${balance} điểm`,
      );
    }

    // Kiểm tra giới hạn % đơn hàng (nếu có orderTotal)
    if (dto.orderTotal) {
      const maxRedeemValue =
        (dto.orderTotal * LOYALTY_CONFIG.MAX_REDEEM_PERCENT) / 100;
      const redeemValue = dto.amount * LOYALTY_CONFIG.POINT_VALUE;

      if (redeemValue > maxRedeemValue) {
        const maxPoints = Math.floor(
          maxRedeemValue / LOYALTY_CONFIG.POINT_VALUE,
        );
        throw new BadRequestException(
          `Tối đa chỉ được dùng ${maxPoints} điểm (${LOYALTY_CONFIG.MAX_REDEEM_PERCENT}% giá trị đơn hàng)`,
        );
      }
    }

    const point = await this.prisma.loyaltyPoint.create({
=======
    return (this.prisma as any).loyaltyPoint.create({
>>>>>>> af947ce73e8cad2354fd505f245c0f7cd9bf7457
      data: {
        userId: dto.userId,
        orderId: dto.orderId,
        amount: -dto.amount, // Số âm cho tiêu điểm
        type: LoyaltyPointType.REDEEMED,
        reason: dto.reason || `Đổi điểm cho đơn #${dto.orderId?.slice(0, 8)}`,
        tenantId,
      },
    });

    this.logger.log(
      `User ${dto.userId} redeemed ${dto.amount} points for order ${dto.orderId}`,
    );

    return {
      ...point,
      discountAmount: dto.amount * LOYALTY_CONFIG.POINT_VALUE,
    };
  }

  /**
   * Tính số tiền giảm khi dùng điểm
   */
  calculateRedemptionValue(points: number): number {
    return points * LOYALTY_CONFIG.POINT_VALUE;
  }

  /**
   * Tính số điểm cần để giảm X đồng
   */
  calculatePointsNeeded(discountAmount: number): number {
    return Math.ceil(discountAmount / LOYALTY_CONFIG.POINT_VALUE);
  }

  // =====================================================================
  // HOÀN ĐIỂM (REFUND POINTS)
  // =====================================================================

  /**
   * Hoàn điểm khi hủy đơn/trả hàng
   */
  async refundPoints(tenantId: string, dto: RefundPointsDto) {
<<<<<<< HEAD
    // Kiểm tra đơn hàng có dùng điểm không
    const redeemedPoints = await this.prisma.loyaltyPoint.findFirst({
      where: {
        orderId: dto.orderId,
        tenantId,
        type: LoyaltyPointType.REDEEMED,
      },
    });

    if (!redeemedPoints) {
      this.logger.log(
        `Order ${dto.orderId} didn't use points. No refund needed.`,
      );
      return null;
    }

    // Kiểm tra đã hoàn điểm chưa (idempotency)
    const existingRefund = await this.prisma.loyaltyPoint.findFirst({
      where: {
        orderId: dto.orderId,
        tenantId,
        type: LoyaltyPointType.REFUNDED,
      },
    });

    if (existingRefund) {
      this.logger.warn(
        `Order ${dto.orderId} already refunded points. Skipping.`,
      );
      return existingRefund;
    }

    // Hoàn số điểm đã tiêu (lấy absolute value)
    const pointsToRefund = dto.amount || Math.abs(redeemedPoints.amount);

    const point = await this.prisma.loyaltyPoint.create({
=======
    return (this.prisma as any).loyaltyPoint.create({
>>>>>>> af947ce73e8cad2354fd505f245c0f7cd9bf7457
      data: {
        userId: dto.userId,
        orderId: dto.orderId,
        amount: pointsToRefund,
        type: LoyaltyPointType.REFUNDED,
        reason:
          dto.reason || `Hoàn điểm do hủy/trả đơn #${dto.orderId?.slice(0, 8)}`,
        tenantId,
      },
    });

    this.logger.log(
      `User ${dto.userId} refunded ${pointsToRefund} points from order ${dto.orderId}`,
    );

    return point;
  }

  // =====================================================================
  // TRUY VẤN ĐIỂM
  // =====================================================================

  /**
   * Lấy số dư điểm hiện tại (tất cả)
   */
  async getUserPointBalance(tenantId: string, userId: string): Promise<number> {
    const result = await (this.prisma as any).loyaltyPoint.aggregate({
      where: { userId, tenantId },
      _sum: { amount: true },
    });

    return result._sum.amount || 0;
  }

<<<<<<< HEAD
  /**
   * Lấy số dư điểm còn hiệu lực (chưa hết hạn)
   */
  async getAvailableBalance(tenantId: string, userId: string): Promise<number> {
    const now = new Date();

    // Điểm tích lũy còn hạn
    const earnedResult = await this.prisma.loyaltyPoint.aggregate({
      where: {
        userId,
        tenantId,
        type: LoyaltyPointType.EARNED,
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      },
      _sum: { amount: true },
=======
  async getUserPointHistory(tenantId: string, userId: string) {
    return (this.prisma as any).loyaltyPoint.findMany({
      where: { userId, tenantId },
      orderBy: { createdAt: 'desc' },
      take: 50,
>>>>>>> af947ce73e8cad2354fd505f245c0f7cd9bf7457
    });

    // Điểm đã tiêu + hoàn
    const usedResult = await this.prisma.loyaltyPoint.aggregate({
      where: {
        userId,
        tenantId,
        type: { in: [LoyaltyPointType.REDEEMED, LoyaltyPointType.REFUNDED] },
      },
      _sum: { amount: true },
    });

    const earned = earnedResult._sum.amount || 0;
    const used = usedResult._sum.amount || 0;

    return Math.max(0, earned + used); // used là số âm cho REDEEMED
  }

  /**
   * Lấy tổng quan điểm của user
   */
  async getUserLoyaltySummary(
    tenantId: string,
    userId: string,
  ): Promise<LoyaltySummary> {
    const now = new Date();
    const thirtyDaysLater = new Date();
    thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);

    const [totalEarned, totalRedeemed, expiringPoints, balance] =
      await Promise.all([
        // Total earned
        this.prisma.loyaltyPoint.aggregate({
          where: { userId, tenantId, type: LoyaltyPointType.EARNED },
          _sum: { amount: true },
        }),

        // Total redeemed
        this.prisma.loyaltyPoint.aggregate({
          where: { userId, tenantId, type: LoyaltyPointType.REDEEMED },
          _sum: { amount: true },
        }),

        // Points expiring in 30 days
        this.prisma.loyaltyPoint.aggregate({
          where: {
            userId,
            tenantId,
            type: LoyaltyPointType.EARNED,
            expiresAt: {
              gt: now,
              lte: thirtyDaysLater,
            },
          },
          _sum: { amount: true },
        }),

        // Current available balance
        this.getAvailableBalance(tenantId, userId),
      ]);

    // Get nearest expiry date
    const nearestExpiry = await this.prisma.loyaltyPoint.findFirst({
      where: {
        userId,
        tenantId,
        type: LoyaltyPointType.EARNED,
        expiresAt: { gt: now },
      },
      orderBy: { expiresAt: 'asc' },
      select: { expiresAt: true },
    });

    return {
      balance,
      totalEarned: totalEarned._sum.amount || 0,
      totalRedeemed: Math.abs(totalRedeemed._sum.amount || 0),
      expiringPoints: expiringPoints._sum.amount || 0,
      expiringDate: nearestExpiry?.expiresAt || null,
      pointValue: LOYALTY_CONFIG.POINT_VALUE,
    };
  }

  /**
   * Lấy lịch sử điểm
   */
  async getUserPointHistory(
    tenantId: string,
    userId: string,
    options?: { page?: number; limit?: number },
  ) {
    const { page = 1, limit = 20 } = options || {};
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.loyaltyPoint.findMany({
        where: { userId, tenantId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.loyaltyPoint.count({ where: { userId, tenantId } }),
    ]);

    return {
      data,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Lấy điểm liên quan đến đơn hàng
   */
  async getOrderPoints(tenantId: string, orderId: string) {
    return (this.prisma as any).loyaltyPoint.findMany({
      where: { orderId, tenantId },
      orderBy: { createdAt: 'asc' },
    });
  }

  // =====================================================================
  // ADMIN FUNCTIONS
  // =====================================================================

  /**
   * Thống kê tổng quan loyalty (Admin Dashboard)
   */
  async getLoyaltyStats(tenantId: string) {
    const now = new Date();

    const [totalEarned, totalRedeemed, activeUsers, expiringThisMonth] =
      await Promise.all([
        this.prisma.loyaltyPoint.aggregate({
          where: { tenantId, type: LoyaltyPointType.EARNED },
          _sum: { amount: true },
        }),
        this.prisma.loyaltyPoint.aggregate({
          where: { tenantId, type: LoyaltyPointType.REDEEMED },
          _sum: { amount: true },
        }),
        this.prisma.loyaltyPoint.groupBy({
          by: ['userId'],
          where: { tenantId },
          _sum: { amount: true },
          having: { amount: { _sum: { gt: 0 } } },
        }),
        this.prisma.loyaltyPoint.aggregate({
          where: {
            tenantId,
            type: LoyaltyPointType.EARNED,
            expiresAt: {
              gt: now,
              lte: new Date(now.getFullYear(), now.getMonth() + 1, 0),
            },
          },
          _sum: { amount: true },
        }),
      ]);

    return {
      totalEarned: totalEarned._sum.amount || 0,
      totalRedeemed: Math.abs(totalRedeemed._sum.amount || 0),
      activeMembers: activeUsers.length,
      expiringThisMonth: expiringThisMonth._sum.amount || 0,
      pointValue: LOYALTY_CONFIG.POINT_VALUE,
      conversionRate: LOYALTY_CONFIG.POINTS_PER_AMOUNT,
    };
  }

  /**
   * Xử lý điểm hết hạn (Chạy hàng ngày qua Cron Job)
   */
  async processExpiredPoints() {
    const now = new Date();

    // Tìm các điểm đã hết hạn nhưng chưa bị thu hồi
    const expiredPoints = await this.prisma.loyaltyPoint.findMany({
      where: {
        type: LoyaltyPointType.EARNED,
        expiresAt: { lt: now },
      },
      select: { id: true, userId: true, amount: true, tenantId: true },
    });

    // Trong thực tế, cần logic phức tạp hơn để tính toán
    // điểm nào đã được tiêu, điểm nào còn để thu hồi
    this.logger.log(`Found ${expiredPoints.length} expired point records`);

    return { processed: expiredPoints.length };
  }
}
