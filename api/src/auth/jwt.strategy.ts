import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { RedisService } from '../redis/redis.service';

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
  constructor(
    configService: ConfigService,
    private readonly redisService: RedisService,
  ) {
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
      passReqToCallback: true,
    });
  }

  /**
   * Hàm này chạy SAU khi token đã verify chữ ký thành công.
   * - Payload: Nội dung giải mã từ token.
   * - Return: Object này sẽ được gán vào `req.user`.
   */
  async validate(
    req: any,
    payload: {
      userId: string;
      permissions: string[];
      jti: string;
      fp?: string;
    },
  ) {
    const { userId, permissions, jti, fp } = payload;

    // 1. Check for Revoked Token (Blacklist) via JTI
    const isRevoked = await this.redisService.get(`jwt:revoked:${jti}`);
    if (isRevoked) {
      throw new Error('Token revoked');
    }

    // 2. Validate Device Fingerprint (Binding)
    if (fp) {
      const userAgent = req.headers['user-agent'] || '';
      const ip = req.ip || '';
      // Simple hash to compare with stored fp
      const currentFp = Buffer.from(`${ip}${userAgent}`)
        .toString('base64')
        .substring(0, 32);

      if (fp !== currentFp) {
        // [P0] Critical security risk: Potential token theft/abuse
        await this.redisService.set(`jwt:revoked:${jti}`, 'true', 'EX', 3600);
        throw new Error('Device fingerprint mismatch');
      }
    }

    return {
      id: userId,
      userId,
      permissions,
      jti,
    };
  }
}
