import { Module } from '@nestjs/common';
import { AdminModule } from './admin/admin.module';
import { SuperAdminModule } from './super-admin/super-admin.module';
import { PlatformAnalyticsModule } from './analytics/platform-analytics.module';
import { PlatformSubscriptionsModule } from './subscriptions/platform-subscriptions.module';
import { PlatformIntegrationsModule } from './integrations/platform-integrations.module';

/**
 * ======================================================================
 * PLATFORM MODULE - Quản lý Platform-level Features
 * ======================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. PLATFORM DOMAIN:
 * - Đây là module quản lý các tính năng cấp Platform (SaaS)
 * - Gom nhóm: Admin, SuperAdmin, Analytics, Subscriptions, Integrations
 *
 * 2. MULTI-TENANCY FOCUS:
 * - Admin: Quản lý tenant-level operations
 * - SuperAdmin: Quản lý toàn bộ platform (cross-tenant)
 * - Subscriptions: Quản lý billing và plans
 *
 * 3. MICROSERVICES READY:
 * - Module này được thiết kế để dễ dàng tách thành service riêng sau này
 *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Admin dashboard quản lý tenant
 * - SuperAdmin quản lý toàn bộ tenants
 * - Analytics hiển thị metrics
 * - Subscription billing và upgrade/downgrade plans
 *
 * ======================================================================
 */

@Module({
  imports: [
    AdminModule,
    SuperAdminModule,
    PlatformAnalyticsModule,
    PlatformSubscriptionsModule,
    PlatformIntegrationsModule,
  ],
  exports: [
    AdminModule,
    SuperAdminModule,
    PlatformAnalyticsModule,
    PlatformSubscriptionsModule,
    PlatformIntegrationsModule,
  ],
})
export class PlatformModule {}
