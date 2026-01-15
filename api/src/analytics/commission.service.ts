/**
 * =====================================================================
 * COMMISSION SERVICE - QUẢN LÝ HOA HỒNG & DOANH THU NỀN TẢNG
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * Đây là module quan trọng nhất trong việc tính toán "Tiền" cho hệ thống.
 * Nó xử lý 3 luồng doanh thu chính:
 *
 * 1. PLATFORM FEE (Phí giao dịch):
 *    - Hệ thống thu phí trên mỗi đơn hàng của Shop (Tenant).
 *    - Công thức: Phí = Tổng đơn * % Phí (tùy theo gói Subscription của Shop).
 *
 * 2. AFFILIATE COMMISSION (Hoa hồng tiếp thị liên kết):
 *    - Hỗ trợ đa cấp (Multi-level):
 *      + Tier 1: Người trực tiếp viết Blog/Review dẫn đến đơn hàng.
 *      + Tier 2: Người giới thiệu ra người Tier 1.
 *    - Hoa hồng được tính dựa trên `% commissionRate` cấu hình cho từng Sản phẩm.
 *
 * 3. SUBSCRIPTION REVENUE:
 *    - Doanh thu từ việc các Shop trả tiền thuê nền tảng hàng tháng.
 *
 * ⚠️ LƯU Ý BẢO MẬT:
 *    - Mọi tính toán tiền tệ phải sử dụng Transaction để tránh sai lệch.
 *    - Cơ chế Idempotency: Kiểm tra đơn hàng đã tính hoa hồng chưa trước khi xử lý lại.
 * =====================================================================
 */

import { PrismaService } from '@core/prisma/prisma.service';
import { Injectable, Logger } from '@nestjs/common';
import { CommissionType, Prisma } from '@prisma/client';

@Injectable()
export class CommissionService {
  private readonly logger = new Logger(CommissionService.name);

  // Cấu hình tỷ lệ hoa hồng (Có thể chuyển vào bảng cài đặt trong tương lai)
  private readonly TIER_1_RATE = 0.05; // 5% cho người giới thiệu trực tiếp (qua Blog)
  private readonly TIER_2_RATE = 0.02; // 2% cho người giới thiệu cấp trên

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Tính toán và lưu Phí nền tảng cùng Hoa hồng tiếp thị cho Đơn hàng.
   * Hàm này nên được gọi khi đơn hàng đã được THANH TOÁN (PAID).
   */
  async calculateForOrder(orderId: string) {
    // 0. Kiểm tra xem đơn này đã tính hoa hồng chưa (Tránh tính trùng)
    const existingTx = await this.prisma.commissionTransaction.findFirst({
      where: { orderId: orderId },
    });
    if (existingTx) {
      this.logger.debug(
        `Đơn hàng ${orderId} đã được tính hoa hồng trước đó. Bỏ qua.`,
      );
      return;
    }

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            sku: {
              include: {
                product: true,
              },
            },
          },
        },
        tenant: {
          include: {
            subscription: {
              include: {
                subscriptionPlan: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      throw new Error(`Không tìm thấy đơn hàng ${orderId}`);
    }

    // [P1] PHÍ GIAO DỊCH NỀN TẢNG (Lợi nhuận từ Tenant)
    // Công thức: PlatformFee = Tổng đơn * % Phí gói cước / 100
    let transactionFeePerc = 0;
    if (order.tenant?.subscription?.subscriptionPlan) {
      transactionFeePerc = Number(
        order.tenant.subscription.subscriptionPlan.transactionFee || 0,
      );
    } else {
      // Dự phòng nếu không có gói cước: mặc định thu 1% phí nền tảng
      transactionFeePerc = 1.0;
    }

    const platformFeeAmount =
      (Number(order.totalAmount) * transactionFeePerc) / 100;

    // [P2] HOA HỒNG TIẾP THỊ (Đa cấp)
    let totalAffiliateCommission = 0;
    const transactions: Prisma.CommissionTransactionCreateManyInput[] = [];

    if (order.referredByBlogId) {
      const blog = await this.prisma.blog.findUnique({
        where: { id: order.referredByBlogId },
        include: { user: { include: { referredByUser: true } } },
      });

      if (blog?.user) {
        // Tính hoa hồng gốc dựa trên tỷ lệ quy định cho từng sản phẩm
        let directCommission = 0;
        for (const item of order.items) {
          const productCommRate = Number(item.sku.product.commissionRate || 5); // Mặc định 5% nếu không cài đặt
          directCommission +=
            (Number(item.priceAtPurchase) * item.quantity * productCommRate) /
            100;
        }

        // 1. Cấp 1: Tác giả bài viết (Trực tiếp)
        if (directCommission > 0) {
          transactions.push({
            userId: blog.user.id,
            orderId: order.id,
            amount: new Prisma.Decimal(directCommission),
            type: 'DIRECT_REFERRAL',
            status: 'COMPLETED',
            note: `Hoa hồng từ giới thiệu Blog: ${blog.title}`,
          });
          totalAffiliateCommission += directCommission;

          // 2. Cấp 2: Người giới thiệu ra tác giả bài viết
          if (blog.user.referredByUserId) {
            const tier2Commission =
              (directCommission * this.TIER_2_RATE) / this.TIER_1_RATE; // VD: 2% trên tổng giá trị đơn
            transactions.push({
              userId: blog.user.referredByUserId,
              orderId: order.id,
              amount: new Prisma.Decimal(tier2Commission),
              type: 'TIER_2_REFERRAL',
              status: 'COMPLETED',
              note: `Hoa hồng gián tiếp từ: ${blog.user.firstName} ${blog.user.lastName}`,
            });
            totalAffiliateCommission += tier2Commission;
          }
        }
      }
    }

    // [P3] LƯU DỮ LIỆU VÀO DATABASE
    await this.prisma.$transaction(async (tx) => {
      // Cập nhật số tiền phí và hoa hồng vào Đơn hàng
      await tx.order.update({
        where: { id: orderId },
        data: {
          platformFeeAmount: new Prisma.Decimal(platformFeeAmount),
          affiliateCommissionAmount: new Prisma.Decimal(
            totalAffiliateCommission,
          ),
        },
      });

      // Tạo nhật ký giao dịch hoa hồng
      if (transactions.length > 0) {
        await tx.commissionTransaction.createMany({
          data: transactions,
        });

        // Cộng số dư vào ví tiền của User (Affiliate)
        for (const txData of transactions) {
          await tx.user.update({
            where: { id: txData.userId },
            data: {
              commissionBalance: {
                increment: txData.amount,
              },
            },
          });
        }
      }
    });

    this.logger.log(
      `Tính toán doanh thu cho Đơn hàng ${orderId}: Phí nền tảng=${platformFeeAmount}, Hoa hồng chi trả=${totalAffiliateCommission}`,
    );

    return {
      platformFeeAmount,
      totalAffiliateCommission,
      transactionCount: transactions.length,
    };
  }

  /**
   * Xử lý thanh toán Gói cước (Hóa đơn Subscription PAID)
   */
  async processSubscriptionInvoice(invoiceId: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
    });

    if (!invoice || invoice.status !== 'PAID') return;

    // Tiền thuê bao tính vào lợi nhuận trực tiếp của nền tảng
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: invoice.tenantId },
      include: { owner: true },
    });

    // Nếu shop này được giới thiệu bởi người khác, người đó sẽ nhận được 10% hoa hồng vĩnh viễn
    const referrerId = tenant?.owner?.referredByUserId;
    if (referrerId) {
      const referralBonus = Number(invoice.amount) * 0.1; // Thưởng 10% vì đã mời shop gia nhập hệ thống

      await this.prisma.$transaction(async (tx) => {
        await tx.commissionTransaction.create({
          data: {
            userId: referrerId,
            amount: new Prisma.Decimal(referralBonus),
            type: 'SUBSCRIPTION_FEE',
            status: 'COMPLETED',
            note: `Thưởng giới thiệu Shop gia nhập nền tảng: ${tenant.name}`,
          },
        });

        await tx.user.update({
          where: { id: referrerId },
          data: {
            commissionBalance: { increment: new Prisma.Decimal(referralBonus) },
          },
        });
      });

      this.logger.log(
        `Đã chi trả ${referralBonus} tiền thưởng subscription cho người giới thiệu ${referrerId}`,
      );
    }
  }

  /**
   * Tổng hợp báo cáo doanh thu toàn hệ thống (Dành cho Super Admin)
   */
  async getGlobalProfitStats() {
    const [orderStats, subStats, referralStats] = await Promise.all([
      // 1. Lợi nhuận từ phí giao dịch đơn hàng
      this.prisma.order.aggregate({
        _sum: { platformFeeAmount: true },
        where: { paymentStatus: 'PAID' },
      }),
      // 2. Tổng doanh thu từ các gói cước Subscription
      this.prisma.invoice.aggregate({
        _sum: { amount: true },
        where: { status: 'PAID' },
      }),
      // 3. Tổng số tiền hoa hồng đã chi trả (Chi phí)
      this.prisma.commissionTransaction.aggregate({
        _sum: { amount: true },
        where: { type: { not: 'WITHDRAWAL' } },
      }),
    ]);

    const orderFees = Number(orderStats._sum.platformFeeAmount || 0);
    const subRevenue = Number(subStats._sum.amount || 0);
    const outgoingCommissions = Number(referralStats._sum.amount || 0);

    return {
      totalGrossRevenue: orderFees + subRevenue,
      platformFeeRevenue: orderFees,
      subscriptionRevenue: subRevenue,
      affiliatePaysonCost: outgoingCommissions,
      netPlatformProfit: orderFees + subRevenue - outgoingCommissions,
      activeTenants: await this.prisma.tenant.count({
        where: { subscription: { isActive: true } },
      }),
    };
  }
}
