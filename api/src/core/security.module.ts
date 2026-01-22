import { AppThrottlerGuard } from '@core/guards/app.throttler.guard';
import { CsrfGuard } from '@core/guards/csrf.guard';
import { LockdownGuard } from '@core/guards/lockdown.guard';
import { SuperAdminIpGuard } from '@core/guards/super-admin-ip.guard';
import { TenantGuard } from '@core/guards/tenant.guard';
import { AuditInterceptor } from '@/audit/audit.interceptor';
import { IdempotencyInterceptor } from '@core/interceptors/idempotency.interceptor';
import { LoggingInterceptor } from '@core/interceptors/logging.interceptor';
import { Global, Module, forwardRef } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';

import { FeatureFlagsModule } from '@/common/feature-flags/feature-flags.module';
import { JwtModule } from '@nestjs/jwt';
import { IdentityModule } from '@/identity/identity.module';

@Global()
@Module({
  imports: [
    FeatureFlagsModule,
    JwtModule.register({}),
    forwardRef(() => IdentityModule),
  ],
  providers: [
    { provide: APP_GUARD, useClass: AppThrottlerGuard },
    { provide: APP_GUARD, useClass: LockdownGuard },
    { provide: APP_GUARD, useClass: SuperAdminIpGuard },
    { provide: APP_GUARD, useClass: CsrfGuard },
    { provide: APP_GUARD, useClass: TenantGuard },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
    { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
    { provide: APP_INTERCEPTOR, useClass: IdempotencyInterceptor },
  ],
})
export class SecurityModule {}
