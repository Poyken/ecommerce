import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

/**
 * =====================================================================
 * AUTH MODULE - Module bảo mật và xác thực
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. SECURITY HUB:
 * - Đây là trung tâm xử lý mọi vấn đề liên quan đến bảo mật: Đăng ký, Đăng nhập, Phân quyền.
 *
 * 2. JWT INTEGRATION:
 * - `JwtModule`: Cung cấp các công cụ để tạo (Sign) và kiểm tra (Verify) mã JWT.
 * - `JwtStrategy`: Định nghĩa cách thức xác thực người dùng qua Token.
 *
 * 3. CROSS-MODULE COMMUNICATION:
 * - Import `NotificationsModule` để có thể gửi email xác nhận hoặc đặt lại mật khẩu ngay trong quá trình xác thực.
 *
 * 4. TOKEN MANAGEMENT:
 * - `TokenService` được tách riêng để quản lý logic phức tạp về Access/Refresh Token, giúp `AuthService` tập trung vào logic nghiệp vụ chính. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Xử lý logic nghiệp vụ, phối hợp các service liên quan để hoàn thành yêu cầu từ Controller.

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
