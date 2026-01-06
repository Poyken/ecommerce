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
 *    - exports: Các service cho module khác sử dụng
 * =====================================================================
 */

import { Module } from '@nestjs/common';
import { TenantsController } from './tenants.controller';
import { TenantsService } from './tenants.service';
import { PlanUsageService } from './plan-usage.service';
import { SubscriptionsService } from './subscriptions.service';

import { SubscriptionsController } from './subscriptions.controller';

@Module({
  controllers: [TenantsController, SubscriptionsController],
  providers: [TenantsService, PlanUsageService, SubscriptionsService],
  exports: [TenantsService, PlanUsageService, SubscriptionsService],
})
export class TenantsModule {}
