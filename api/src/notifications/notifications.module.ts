import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

/**
 * =====================================================================
 * NOTIFICATIONS MODULE - Module quản lý thông báo và hàng đợi
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. MESSAGE QUEUE (Hàng đợi tin nhắn):
 * - Sử dụng BullMQ để quản lý các tác vụ chạy ngầm.
 * - `registerQueue`: Khai báo một hàng đợi tên là `email-queue`. Đây là nơi các module khác sẽ đẩy "Job" vào.
 *
 * 2. WEBSOCKET GATEWAY:
 * - NotificationsGateway xử lý kết nối WebSocket
 * - Cho phép push thông báo real-time đến client
 * - Sử dụng JWT để xác thực WebSocket connections
 *
 * 3. SEPARATION OF CONCERNS:
 * - Module này tập trung quản lý việc "gửi đi" các thông báo.
 * - Giúp các module khác (như Auth, Order) không cần quan tâm đến việc email được gửi như thế nào, chỉ cần đẩy dữ liệu vào hàng đợi.
 *
 * 4. EXPORTS:
 * - Export `BullModule` để các module khác có thể sử dụng decorator `@InjectQueue('email-queue')`.
 * - Export `NotificationsService` để các module khác có thể tạo thông báo.
 * - Export `NotificationsGateway` để có thể push thông báo real-time. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Xử lý logic nghiệp vụ, phối hợp các service liên quan để hoàn thành yêu cầu từ Controller.

 * =====================================================================
 */
import { EmailProcessor } from './processors/email.processor';

import { EmailModule } from '@integrations/email/email.module';
import { PrismaModule } from '@core/prisma/prisma.module';
import { NotificationsController } from './notifications.controller';
import { NotificationsGateway } from './notifications.gateway';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'email-queue',
    }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_ACCESS_SECRET'),
        signOptions: { expiresIn: '7d' },
      }),
      inject: [ConfigService],
    }),
    PrismaModule,
    EmailModule,
  ],
  controllers: [NotificationsController],
  providers: [EmailProcessor, NotificationsService, NotificationsGateway],
  exports: [BullModule, NotificationsService, NotificationsGateway],
})
export class NotificationsModule {}
