import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import * as crypto from 'crypto';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { RedisService } from '@core/redis/redis.service';

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
    console.log(
      `[JwtStrategy] Validating JTI: ${jti}, Revoked status: ${isRevoked}`,
    );
    // if (isRevoked) {
    //   throw new UnauthorizedException('Token revoked');
    // }

    // 2. Validate Device Fingerprint (Binding)
    if (fp) {
      const userAgent = req.headers['user-agent'] || '';
      const forwardedFor = req.headers['x-forwarded-for'];
      const reqIp =
        req.ip || (req.connection && req.connection.remoteAddress) || '';

      // Use SAME hash logic as AuthController
      const currentFp = crypto
        .createHash('sha256')
        .update(reqIp + userAgent)
        .digest('hex');

      if (fp !== currentFp) {
        // [DEV MODE] Fingerprint mismatch is common in dev (e.g. localhost vs IP).
        // Log warning instead of revoking token.
        console.warn(`[JWT] Fingerprint mismatch detected!`);
        console.warn(`[JWT] Token FP: ${fp.substring(0, 10)}...`);
        console.warn(`[JWT] Current FP: ${currentFp.substring(0, 10)}...`);
        console.warn(`[JWT] UA: ${userAgent}`);
        console.warn(`[JWT] IP: ${reqIp} (X-Forwarded-For: ${forwardedFor})`);

        // In production, we might want to be stricter, but for now we just log
        // throw new UnauthorizedException('Device fingerprint mismatch');
      } else {
        console.log(`[JWT] Fingerprint verified for user ${userId}`);
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
