/**
 * =====================================================================
 * TENANTS.MODULE MODULE
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * Module này đóng gói các thành phần liên quan lại với nhau.
 *
 * 1. CẤU TRÚC MODULE:
 *    - imports: Các module khác cần sử dụng
 *    - controllers: Các controller xử lý request
 *    - providers: Các service cung cấp logic
 *    - exports: Các service cho module khác sử dụng *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Xử lý logic nghiệp vụ, phối hợp các service liên quan để hoàn thành yêu cầu từ Controller.

 * =====================================================================
 */

import { Module } from '@nestjs/common';
import { TenantsController } from './tenants.controller';
import { TenantsService } from './tenants.service';
import { PlanUsageService } from './plan-usage.service';
import { SubscriptionsService } from './subscriptions.service';

import { SubscriptionsController } from './subscriptions.controller';
import { TenantSettingsController } from './tenant-settings.controller';

@Module({
  controllers: [
    TenantsController,
    SubscriptionsController,
    TenantSettingsController,
  ],
  providers: [TenantsService, PlanUsageService, SubscriptionsService],
  exports: [TenantsService, PlanUsageService, SubscriptionsService],
})
export class TenantsModule {}
