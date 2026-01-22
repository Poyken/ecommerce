import { Module } from '@nestjs/common';
import { PlansModule } from './plans/plans.module';
import { SubscriptionModule } from './subscription/subscription.module';

/**
 * ======================================================================
 * PLATFORM SUBSCRIPTIONS MODULE - Quản lý Plans & Subscriptions
 * =========================================================================
 *
 * 📚 GIẢI THÍCH:
 *
 * 1. CONSOLIDATION:
 * - Gom Plans và Subscription logic vào một module
 * - Plans định nghĩa các gói dịch vụ (Free, Pro, Enterprise)
 * - Subscription quản lý trạng thái đăng ký của Tenant
 *
 * ======================================================================
 */

@Module({
  imports: [PlansModule, SubscriptionModule],
  exports: [PlansModule, SubscriptionModule],
})
export class PlatformSubscriptionsModule {}
