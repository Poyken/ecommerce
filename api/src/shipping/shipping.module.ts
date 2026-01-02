import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { GHNService } from './ghn.service';
import { ShippingController } from './shipping.controller';
import { ShippingCronService } from './shipping.cron.service';
import { ShippingService } from './shipping.service';

import { NotificationsModule } from '@/notifications/notifications.module';
import { EmailModule } from '@integrations/email/email.module';

@Module({
  imports: [HttpModule, NotificationsModule, EmailModule],
  controllers: [ShippingController],
  providers: [ShippingService, GHNService, ShippingCronService],
  exports: [ShippingService, GHNService],
})
/**
 * =====================================================================
 * SHIPPING MODULE
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. EXTERNAL MODULES IMPORTS:
 * - `HttpModule`: Dùng để gọi API bên thứ 3 (Giao Hàng Nhanh - GHN).
 * - `NotificationsModule` & `EmailModule`: Để gửi thông báo/email khi trạng thái vận chuyển thay đổi.
 *
 * 2. CRON JOBS (`ShippingCronService`):
 * - Service này chứa các tác vụ chạy ngầm định kỳ (VD: quét đơn hàng đang giao để cập nhật trạng thái).
 * - Được đăng ký trong `providers` để NestJS khởi tạo instance của nó.
 * =====================================================================
 */
export class ShippingModule {}
