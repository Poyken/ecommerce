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
