import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { GHNService } from './ghn.service';
import { ShippingController } from './shipping.controller';
import { ShippingCronService } from './shipping.cron.service';
import { ShippingService } from './shipping.service';

import { NotificationsModule } from '@/notifications/notifications.module';
import { EmailModule } from '@integrations/email/email.module';

import { PrismaModule } from '@core/prisma/prisma.module';
import { SHIPMENT_REPOSITORY } from '../domain/repositories/shipment.repository.interface';
import { PrismaShipmentRepository } from '../infrastructure/repositories/prisma-shipment.repository';
import { UpdateShipmentStatusUseCase } from '../application/use-cases/shipments/update-shipment-status.use-case';

@Module({
  imports: [HttpModule, NotificationsModule, EmailModule, PrismaModule],
  controllers: [ShippingController],
  providers: [
    ShippingService,
    GHNService,
    ShippingCronService,
    {
      provide: SHIPMENT_REPOSITORY,
      useClass: PrismaShipmentRepository,
    },
    UpdateShipmentStatusUseCase,
  ],
  exports: [ShippingService, GHNService, UpdateShipmentStatusUseCase],
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
 * - Được đăng ký trong `providers` để NestJS khởi tạo instance của nó. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Xử lý logic nghiệp vụ, phối hợp các service liên quan để hoàn thành yêu cầu từ Controller.

 * =====================================================================
 */
export class ShippingModule {}
