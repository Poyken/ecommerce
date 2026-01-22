/**
 * =====================================================================
 * APP MODULE - Gốc rễ của toàn bộ ứng dụng
 * =====================================================================
 *
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
