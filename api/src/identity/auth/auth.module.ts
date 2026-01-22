import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

/**
 * =====================================================================
 * AUTH MODULE - Module bảo mật và xác thực
 * =====================================================================
 *
 * =====================================================================
 */
import { NotificationsModule } from '@/notifications/notifications.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { TokenService } from './token.service';
import { TwoFactorService } from './two-factor.service';

import { EmailModule } from '@/platform/integrations/external/email/email.module';
import { PermissionService } from './permission.service';
import { FacebookStrategy } from './strategies/facebook.strategy';
import { GoogleStrategy } from './strategies/google.strategy';

@Module({
  imports: [JwtModule.register({}), NotificationsModule, EmailModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    TokenService,
    JwtStrategy,
    GoogleStrategy,
    FacebookStrategy,
    TwoFactorService, // Added TwoFactorService
    PermissionService, // Added PermissionService for centralized permission management
  ],
  exports: [AuthService, TokenService, TwoFactorService, PermissionService], // Export PermissionService
})
export class AuthModule {}
