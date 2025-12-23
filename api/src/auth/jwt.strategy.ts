import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

/**
 * =====================================================================
 * JWT STRATEGY - Chiến lược xác thực bằng mã JWT
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. PASSPORT STRATEGY:
 * - Đây là một "chiến lược" (Strategy) cụ thể trong thư viện Passport.
 * - Nó định nghĩa cách thức ứng dụng trích xuất và kiểm tra tính hợp lệ của một mã JWT.
 *
 * 2. TOKEN EXTRACTION:
 * - `ExtractJwt.fromAuthHeaderAsBearerToken()`: Tự động tìm token trong Header `Authorization` có tiền tố là `Bearer`.
 *
 * 3. VALIDATION STEP:
 * - Hàm `validate` chỉ được gọi khi chữ ký (Signature) của token đã được xác minh là đúng.
 * - Dữ liệu trả về từ hàm này sẽ được NestJS tự động gán vào `request.user`.
 *
 * 4. PAYLOAD MAPPING:
 * - Ta trích xuất `userId` và `permissions` từ payload để các Guard và Controller phía sau có thể sử dụng thông tin này mà không cần truy vấn lại Database.
 * =====================================================================
 */

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(configService: ConfigService) {
    super({
      // 1. Lấy token từ Header HOẶC Cookie
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (request: any) => {
          // Fallback to cookie
          if (request && request.headers && request.headers.cookie) {
            const cookies = request.headers.cookie
              .split(';')
              .reduce((acc: any, cookie: string) => {
                const [key, value] = cookie.trim().split('=');
                acc[key] = value;
                return acc;
              }, {});
            return cookies['accessToken'];
          }
          return null;
        },
      ]),
      // 2. Không bỏ qua token hết hạn (Tự động throw 401 nếu hết hạn)
      ignoreExpiration: false,
      // 3. Secret Key để verify chữ ký (phải khớp với lúc sign)
      secretOrKey:
        configService.get<string>('JWT_ACCESS_SECRET') || 'access-secret',
    });
  }

  /**
   * Hàm này chạy SAU khi token đã verify chữ ký thành công.
   * - Payload: Nội dung giải mã từ token.
   * - Return: Object này sẽ được gán vào `req.user`.
   */
  validate(payload: { userId: string; permissions: string[] }) {
    return {
      id: payload.userId, // Map userId to id for consistency
      userId: payload.userId,
      permissions: payload.permissions, // Gán permissions để dùng trong PermissionsGuard
    };
  }
}
