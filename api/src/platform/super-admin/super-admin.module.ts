/**
 * =====================================================================
 * SUPER ADMIN MODULE
 * =====================================================================
 *
 * =====================================================================
 */
import { Module } from '@nestjs/common';
import { SuperAdminService } from './super-admin.service';
import { SuperAdminController } from './super-admin.controller';
import { AuthModule } from '@/identity/auth/auth.module';
import { PlatformAnalyticsController } from '@/platform/platform-analytics.controller';

@Module({
  imports: [AuthModule],
  controllers: [SuperAdminController, PlatformAnalyticsController],
  providers: [SuperAdminService],
})
export class SuperAdminModule {}
