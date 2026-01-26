import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { NotificationsModule } from '@/notifications/notifications.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { TokenService } from './token.service';
import { TwoFactorService } from './two-factor.service';

import { EmailModule } from '@/platform/integrations/external/email/email.module';
import { UsersModule } from '../users/users.module';
import { TenantsModule } from '../tenants/tenants.module';
import { PermissionService } from './permission.service';
import { FacebookStrategy } from './strategies/facebook.strategy';
import { GoogleStrategy } from './strategies/google.strategy';
import { PromotionsModule } from '@/marketing/promotions/promotions.module';

// Clean Architecture
import { USER_REPOSITORY } from '../domain/repositories/user.repository.interface';
import { PrismaUserRepository } from '../infrastructure/repositories/prisma-user.repository';
import { TENANT_REPOSITORY } from '../domain/repositories/tenant.repository.interface';
import { PrismaTenantRepository } from '../infrastructure/repositories/prisma-tenant.repository';
import { PASSWORD_HASHER } from '../domain/services/password-hasher.interface';
import { BcryptPasswordHasher } from '../infrastructure/services/bcrypt-password-hasher.service';
import * as UseCases from '../application/use-cases/auth';

@Module({
  imports: [
    JwtModule.register({}),
    NotificationsModule,
    EmailModule,
    UsersModule,
    TenantsModule,
    PromotionsModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    TokenService,
    JwtStrategy,
    GoogleStrategy,
    FacebookStrategy,
    TwoFactorService,
    PermissionService,
    {
      provide: PASSWORD_HASHER,
      useClass: BcryptPasswordHasher,
    },
    ...Object.values(UseCases),
  ],
  exports: [
    AuthService,
    TokenService,
    TwoFactorService,
    PermissionService,
    PASSWORD_HASHER,
    ...Object.values(UseCases),
  ],
})
export class AuthModule {}
