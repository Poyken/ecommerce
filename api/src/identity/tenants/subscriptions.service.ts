/**
 * =====================================================================
 * SUBSCRIPTIONS.SERVICE SERVICE
 * =====================================================================
 *
 * =====================================================================
 */

import { PrismaService } from '@core/prisma/prisma.service';
import { Injectable, NotFoundException } from '@nestjs/common';
import { BillingFrequency, TenantPlan } from '@prisma/client';

@Injectable()
export class SubscriptionsService {
  constructor(private readonly prisma: PrismaService) {}

  async upgradePlan(
    tenantId: string,
    plan: TenantPlan,
    frequency: BillingFrequency,
  ) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });
    if (!tenant) throw new NotFoundException('Tenant not found');

    // 1. Create or Update Subscription
    // In real world, we would call Stripe/PayPal here.
    // For now, we simulate success.

    // Calculate next billing date
    const now = new Date();
    const nextBilling = new Date(now);
    if (frequency === 'MONTHLY') {
      nextBilling.setMonth(nextBilling.getMonth() + 1);
    } else {
      nextBilling.setFullYear(nextBilling.getFullYear() + 1);
    }

    const subscription = await this.prisma.subscription.upsert({
      where: { tenantId },
      create: {
        tenantId,
        plan,
        billingFrequency: frequency,
        nextBillingDate: nextBilling,
        isActive: true,
      },
      update: {
        plan,
        billingFrequency: frequency,
        nextBillingDate: nextBilling,
        isActive: true, // Reactivate if was cancelled
      },
    });

    // 2. Update Tenant Plan
    await this.prisma.tenant.update({
      where: { id: tenantId },
      data: { plan },
    });

    // 3. Create Invoice (Record keeping)
    // Pricing logic would go here. Mock prices:
    const prices = {
      [TenantPlan.BASIC]: 0,
      [TenantPlan.PRO]: 29,
      [TenantPlan.ENTERPRISE]: 99,
    };

    const amount = prices[plan] * (frequency === 'YEARLY' ? 10 : 1); // 2 months free for yearly

    await this.prisma.invoice.create({
      data: {
        tenantId,
        subscriptionId: subscription.id,
        amount,
        currency: 'USD',
        status: 'PAID', // Auto-paid in this simulation
        dueDate: now,
        paidAt: now,
        description: `Upgrade to ${plan} (${frequency})`,
      },
    });

    return subscription;
  }

  async getCurrentSubscription(tenantId: string) {
    return this.prisma.subscription.findUnique({
      where: { tenantId },
      include: {
        invoices: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  async findAll(query: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string; // 'Active' | 'PastDue' etc.
  }) {
    const { page = 1, limit = 10, search, status } = query;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.tenant = {
        name: { contains: search, mode: 'insensitive' },
      };
    }

    if (status) {
      where.isActive = status === 'Active';
      // More complex status logic if needed (e.g. Past Due based on date)
    }

    const [subscriptions, total] = await Promise.all([
      this.prisma.subscription.findMany({
        where,
        skip,
        take: limit,
        include: {
          tenant: { select: { name: true, domain: true } },
        },
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.subscription.count({ where }),
    ]);

    return {
      data: subscriptions,
      meta: {
        total,
        page,
        limit,
        lastPage: Math.ceil(total / limit),
      },
    };
  }

  async cancelSubscription(tenantId: string) {
    return this.prisma.subscription.update({
      where: { tenantId },
      data: {
        isActive: false,
        cancelAtPeriodEnd: true,
      },
    });
  }

  async update(id: string, data: any) {
    return this.prisma.subscription.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    return this.prisma.subscription.delete({
      where: { id },
    });
  }
}
