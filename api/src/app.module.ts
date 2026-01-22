/**
 * =====================================================================
 * APP MODULE - Gốc rễ của toàn bộ ứng dụng
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. CENTRAL HUB:
 * - Đây là nơi quy tụ tất cả các module con. NestJS xây dựng ứng dụng theo cấu trúc cây, và `AppModule` chính là cái gốc.
 *
 * 2. CONFIGURATION & VALIDATION:
 * - `ConfigModule`: Sử dụng `Joi` để kiểm tra các biến môi trường (`.env`) ngay khi khởi động. Nếu thiếu một biến quan trọng (như `DATABASE_URL`), ứng dụng sẽ báo lỗi và không chạy, giúp tránh lỗi runtime khó tìm.
 *
 * 3. RATE LIMITING (Chống tấn công):
 * - `ThrottlerModule`: Giới hạn số lượng request từ một IP trong một khoảng thời gian. Giúp bảo vệ server khỏi các cuộc tấn công Brute Force hoặc Spam.
 *
 * 4. ASYNC INFRASTRUCTURE:
 * - `BullModule`: Cấu hình kết nối tới Redis để phục vụ cho các hàng đợi (Queue) xử lý tác vụ nặng.
 *
 * 5. GLOBAL PROVIDERS:
 * - `APP_GUARD`: Ta đăng ký `ThrottlerGuard` ở cấp độ toàn cầu để bảo vệ mọi API mà không cần khai báo lại ở từng Controller. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Xử lý logic nghiệp vụ, phối hợp các service liên quan để hoàn thành yêu cầu từ Controller.

 * =====================================================================
 */

import { CoreInfraModule } from './core/core-infra.module';
import { SecurityModule } from './core/security.module';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { CorrelationIdMiddleware } from '@core/middlewares/correlation-id.middleware';
import { TenantMiddleware } from '@core/tenant/tenant.middleware';
import { HealthController } from './health.controller';
import { IdentityModule } from './identity/identity.module';
import { MarketingModule } from './marketing/marketing.module';
import { OperationsModule } from './operations/operations.module';
import { CatalogModule } from './catalog/catalog.module';
import { SalesModule } from './sales/sales.module';
import { PlatformModule } from '@/platform/platform.module';
import { CommonModule } from '@/common/common.module';
import { AuditModule } from '@/audit/audit.module';
import { CmsModule } from '@/cms/cms.module';
import { NotificationsModule } from '@/notifications/notifications.module';
import { FeatureFlagsModule } from '@/common/feature-flags/feature-flags.module';
import { WorkerModule } from '@/worker/worker.module';
import { ChatModule } from './chat/chat.module';
import { AiModule } from '@/ai/ai.module';
import { DevToolsModule } from './dev-tools/dev-tools.module';


@Module({
  imports: [
    CoreInfraModule,
    SecurityModule,

    IdentityModule,
    MarketingModule,
    OperationsModule,
    CatalogModule,
    SalesModule,
    PlatformModule,
    
    CommonModule,
    AuditModule,
    CmsModule,
    NotificationsModule,
    FeatureFlagsModule,
    WorkerModule,
    ChatModule,
    AiModule,
    DevToolsModule,
  ],
  controllers: [HealthController],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CorrelationIdMiddleware).forRoutes('*');
    consumer.apply(TenantMiddleware).forRoutes('*');
  }
}
