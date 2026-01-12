import { PrismaService } from '@core/prisma/prisma.service';
import { Injectable, Logger } from '@nestjs/common';
import { CommissionType, Prisma } from '@prisma/client';

@Injectable()
export class CommissionService {
  private readonly logger = new Logger(CommissionService.name);

  // Commission Rates Configuration (Can be moved to a settings table later)
  private readonly TIER_1_RATE = 0.05; // 5% for direct blog referral
  private readonly TIER_2_RATE = 0.02; // 2% for parent affiliate (who referred the seller/creator)

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Calculate and save platform fees and affiliate commissions for an order.
   * This should be called when an order is PAID.
   */
  async calculateForOrder(orderId: string) {
    // 0. Check if already calculated (Idempotency)
    const existingTx = await this.prisma.commissionTransaction.findFirst({
      where: { orderId: orderId },
    });
    if (existingTx) {
      this.logger.debug(
        `Order ${orderId} already has commission calculated. Skipping.`,
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
      throw new Error(`Order ${orderId} not found`);
    }

    // [P1] PLATFORM TRANSACTION FEE (Profit from Tenant)
    // Formula: PlatformFee = OrderTotal * SubscriptionPlan.transactionFee / 100
    let transactionFeePerc = 0;
    if (order.tenant?.subscription?.subscriptionPlan) {
      transactionFeePerc = Number(
        order.tenant.subscription.subscriptionPlan.transactionFee || 0,
      );
    } else {
      // Emergency fallback if no plan: use default 1% platform fee
      transactionFeePerc = 1.0;
    }

    const platformFeeAmount =
      (Number(order.totalAmount) * transactionFeePerc) / 100;

    // [P2] AFFILIATE COMMISSIONS (Multi-level)
    let totalAffiliateCommission = 0;
    const transactions: Prisma.CommissionTransactionCreateManyInput[] = [];

    if (order.referredByBlogId) {
      const blog = await this.prisma.blog.findUnique({
        where: { id: order.referredByBlogId },
        include: { user: { include: { referredByUser: true } } },
      });

      if (blog?.user) {
        // Calculate base commission from product rates or fixed tier 1
        let directCommission = 0;
        for (const item of order.items) {
          const productCommRate = Number(item.sku.product.commissionRate || 5); // Default to 5% if not set
          directCommission +=
            (Number(item.priceAtPurchase) * item.quantity * productCommRate) /
            100;
        }

        // 1. Level 1: Blog Author (Direct)
        if (directCommission > 0) {
          transactions.push({
            userId: blog.user.id,
            orderId: order.id,
            amount: new Prisma.Decimal(directCommission),
            type: 'DIRECT_REFERRAL',
            status: 'COMPLETED',
            note: `Commission from blog referral: ${blog.title}`,
          });
          totalAffiliateCommission += directCommission;

          // 2. Level 2: Parent Affiliate (Referrer of the Author)
          if (blog.user.referredByUserId) {
            const tier2Commission =
              (directCommission * this.TIER_2_RATE) / this.TIER_1_RATE; // e.g., 2% of original sale
            transactions.push({
              userId: blog.user.referredByUserId,
              orderId: order.id,
              amount: new Prisma.Decimal(tier2Commission),
              type: 'TIER_2_REFERRAL',
              status: 'COMPLETED',
              note: `Indirect commission from referral: ${blog.user.firstName} ${blog.user.lastName}`,
            });
            totalAffiliateCommission += tier2Commission;
          }
        }
      }
    }

    // [P3] PERSIST DATA
    await this.prisma.$transaction(async (tx) => {
      // Update order amounts
      await tx.order.update({
        where: { id: orderId },
        data: {
          platformFeeAmount: new Prisma.Decimal(platformFeeAmount),
          affiliateCommissionAmount: new Prisma.Decimal(
            totalAffiliateCommission,
          ),
        },
      });

      // Create transaction logs
      if (transactions.length > 0) {
        await tx.commissionTransaction.createMany({
          data: transactions,
        });

        // Update user balances
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
      `Calculated profit for Order ${orderId}: Fees=${platformFeeAmount}, Commission=${totalAffiliateCommission}`,
    );

    return {
      platformFeeAmount,
      totalAffiliateCommission,
      transactionCount: transactions.length,
    };
  }

  /**
   * Process a Subscription Payment (Invoice PAID)
   */
  async processSubscriptionInvoice(invoiceId: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
    });

    if (!invoice || invoice.status !== 'PAID') return;

    // Subscription money acts as platform profit
    // In a robust system, we might also give commission to people who referred the Tenant to join the platform
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: invoice.tenantId },
      include: { owner: true },
    });

    // If tenant was referred by someone, maybe they get a cut of every subscription payment?
    // Let's implement this if tenant's owner has a referrer
    const referrerId = tenant?.owner?.referredByUserId;
    if (referrerId) {
      const referralBonus = Number(invoice.amount) * 0.1; // 10% referral bonus for platform growth

      await this.prisma.$transaction(async (tx) => {
        await tx.commissionTransaction.create({
          data: {
            userId: referrerId,
            amount: new Prisma.Decimal(referralBonus),
            type: 'SUBSCRIPTION_FEE',
            status: 'COMPLETED',
            note: `Referral bonus from tenant subscription: ${tenant.name}`,
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
        `Paid ${referralBonus} subscription bonus to ${referrerId}`,
      );
    }
  }

  /**
   * Get detailed global revenue report for Super Admin
   */
  async getGlobalProfitStats() {
    const [orderStats, subStats, referralStats] = await Promise.all([
      // 1. Profit from order transaction fees
      this.prisma.order.aggregate({
        _sum: { platformFeeAmount: true },
        where: { paymentStatus: 'PAID' },
      }),
      // 2. Total revenue from subscriptions
      this.prisma.invoice.aggregate({
        _sum: { amount: true },
        where: { status: 'PAID' },
      }),
      // 3. Outgoing commissions (Cost)
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
