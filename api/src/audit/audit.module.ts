import { BullModule } from '@nestjs/bullmq';
import { Global, Module } from '@nestjs/common';
import { AuditController } from './audit.controller';
import { AuditProcessor } from './audit.processor';
import { AuditService } from './audit.service';

@Global()
@Module({
  imports: [
    BullModule.registerQueue({
      name: 'audit',
    }),
  ],
  providers: [AuditService, AuditProcessor],
  controllers: [AuditController],
  exports: [AuditService],
})
/**
 * =====================================================================
 * AUDIT MODULE - Hệ thống ghi nhật ký hoạt động
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. @Global() DECORATOR:
 * - Đánh dấu module này là "Global".
 * - Nghĩa là Import 1 lần ở `AppModule`, dùng được ở MỌI NƠI mà không cần import lại.
 * - Thường dùng cho các tính năng nền tảng như Logging, Helper, Database.
 *
 * 2. QUEUE PROCESSING (BullMQ):
 * - Audit log là tác vụ "phụ" (không ảnh hưởng trực tiếp đến user).
 * - Sử dụng Queue (`audit`) để xử lý bất đồng bộ (Async).
 * - User bấm nút -> API trả về ngay -> Worker âm thầm ghi log sau.
 * -> Giúp API phản hồi nhanh hơn. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Tiếp nhận request từ Client, điều phối xử lý và trả về response.

 * =====================================================================
 */
export class AuditModule {}
