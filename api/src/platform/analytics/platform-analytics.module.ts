import { Module } from '@nestjs/common';
import { AnalyticsModule } from './analytics.module';
import { ReportsModule } from './reports/reports.module';

/**
 * ======================================================================
 * PLATFORM ANALYTICS MODULE - Quản lý Analytics & Reports
 * ======================================================================
 *
 * 📚 GIẢI THÍCH:
 *
 * 1. CONSOLIDATION:
 * - Gom Analytics và Reports vào một module để dễ quản lý
 *
 * 2. EXPORTS:
 * - Export cả hai modules để dùng ở nơi khác (VD: SuperAdminModule)
 *
 * ======================================================================
 */

@Module({
  imports: [AnalyticsModule, ReportsModule],
  exports: [AnalyticsModule, ReportsModule],
})
export class PlatformAnalyticsModule {}
