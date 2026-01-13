import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@/core/prisma/prisma.service';
import { PaymentService } from '@/payment/payment.service';
import { BillingFrequency, TenantPlan } from '@prisma/client';

@Injectable()
export class SubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentService: PaymentService,
  ) {}

  /**
   * Lấy danh sách các gói dịch vụ có sẵn
   */
  async getPlans() {
    return this.prisma.subscriptionPlan.findMany({
      where: { isActive: true, isPublic: true },
      orderBy: { priceMonthly: 'asc' },
    });
  }

  /**
   * Lấy chi tiết một gói dịch vụ
   */
  async getPlan(planIdOrSlug: string) {
    const plan = await this.prisma.subscriptionPlan.findFirst({
      where: {
        OR: [{ id: planIdOrSlug }, { slug: planIdOrSlug }],
        isActive: true,
      },
    });

    if (!plan) {
      throw new NotFoundException('Plan not found');
    }

    return plan;
  }

  /**
   * Lấy subscription hiện tại của tenant
   */
  async getCurrentSubscription(tenantId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { tenantId },
      include: { subscriptionPlan: true },
    });

    return subscription;
  }

  /**
   * Đăng ký gói dịch vụ mới
   */
  async purchasePlan(
    tenantId: string,
    planId: string,
    frequency: BillingFrequency,
    paymentMethod: string,
    returnUrl?: string,
  ) {
    // Kiểm tra gói dịch vụ
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id: planId },
    });

    if (!plan || !plan.isActive) {
      throw new NotFoundException('Plan not found or inactive');
    }

    // Kiểm tra tenant đã có subscription không
    const existingSub = await this.prisma.subscription.findUnique({
      where: { tenantId },
    });

    // Tính giá
    const price =
      frequency === BillingFrequency.YEARLY
        ? Number(plan.priceYearly)
        : Number(plan.priceMonthly);

    // Tính ngày hết hạn
    const now = new Date();
    const nextBillingDate = new Date(now);
    if (frequency === BillingFrequency.YEARLY) {
      nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
    } else {
      nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
    }

    // Upsert subscription
    const subscription = await this.prisma.subscription.upsert({
      where: { tenantId },
      create: {
        tenantId,
        planId,
        plan: TenantPlan.PRO, // Map from SubscriptionPlan
        billingFrequency: frequency,
        startDate: now,
        nextBillingDate,
        isActive: false, // Will activate after payment
      },
      update: {
        planId,
        billingFrequency: frequency,
        nextBillingDate,
        isActive: false,
      },
    });

    // Tạo invoice
    const invoice = await this.prisma.invoice.create({
      data: {
        tenantId,
        subscriptionId: subscription.id,
        amount: price,
        currency: plan.currency,
        dueDate: now,
        status: 'PENDING',
        description: `Subscription: ${plan.name} (${frequency})`,
      },
    });

    // Xử lý thanh toán
    let paymentUrl: string | undefined;
    try {
      const paymentResult = await this.paymentService.processPayment(
        paymentMethod,
        {
          amount: price,
          orderId: invoice.id,
          returnUrl,
        },
      );

      if (paymentResult.success && paymentResult.paymentUrl) {
        paymentUrl = paymentResult.paymentUrl;
      } else if (paymentResult.success) {
        await this.activateSubscription(subscription.id, invoice.id);
      }
    } catch (error) {
      this.logger.error(`Payment failed: ${(error as any).message}`);
      throw new BadRequestException(
        `Payment failed: ${(error as any).message}`,
      );
    }

    return { subscription, invoice, paymentUrl };
  }

  /**
   * Kích hoạt subscription sau khi thanh toán thành công
   */
  async activateSubscription(subscriptionId: string, invoiceId: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
    });

    if (!invoice || invoice.status === 'PAID') {
      this.logger.warn(
        `Invoice ${invoiceId} already paid or not found. Skipping activation.`,
      );
      return true;
    }

    await this.prisma.$transaction([
      this.prisma.subscription.update({
        where: { id: subscriptionId },
        data: { isActive: true },
      }),
      this.prisma.invoice.update({
        where: { id: invoiceId },
        data: { status: 'PAID', paidAt: new Date() },
      }),
    ]);

    return true;
  }

  /**
   * Gia hạn subscription
   */
  async renewSubscription(tenantId: string, returnUrl?: string) {
    const currentSub = await this.getCurrentSubscription(tenantId);

    if (!currentSub || !currentSub.planId) {
      throw new NotFoundException('No active subscription found');
    }

    return this.purchasePlan(
      tenantId,
      currentSub.planId,
      currentSub.billingFrequency,
      'VNPAY',
      returnUrl,
    );
  }

  /**
   * [DEV] Simulate payment callback để active subscription
   */
  async simulatePaymentSuccess(subscriptionId: string) {
    const subscription = await this.prisma.subscription.findUnique({
      where: { id: subscriptionId },
    });

    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }

    const invoice = await this.prisma.invoice.findFirst({
      where: { subscriptionId },
      orderBy: { createdAt: 'desc' },
    });

    if (invoice) {
      await this.activateSubscription(subscriptionId, invoice.id);
    } else {
      await this.prisma.subscription.update({
        where: { id: subscriptionId },
        data: { isActive: true },
      });
    }

    return { success: true, message: 'Subscription activated' };
  }
}
