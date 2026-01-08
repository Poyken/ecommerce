import { getFingerprint } from '@/common/utils/fingerprint';
import { PrismaService } from '@/core/prisma/prisma.service';
import { RedisService } from '@core/redis/redis.service';
import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { EncryptionService } from '@core/security/encryption.service';
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
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    configService: ConfigService,
    private readonly redisService: RedisService,
    private readonly prisma: PrismaService,
    private readonly encryptionService: EncryptionService,
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
    this.logger.debug(
      `[JwtStrategy] Validating JTI: ${jti}, Revoked status: ${isRevoked}`,
    );
    // if (isRevoked) {
    //   throw new UnauthorizedException('Token revoked');
    // }

    // 2. Validate Device Fingerprint (Binding)
    if (fp) {
      // Use SAME hash logic as AuthController via shared utility
      const currentFp = getFingerprint(req);

      if (fp !== currentFp) {
        // [DEV MODE] Fingerprint mismatch is common in dev (e.g. localhost vs IP).
        // Log warning instead of revoking token.
        this.logger.warn(`[JWT] Fingerprint mismatch detected!`);
        this.logger.debug(`[JWT] Token FP: ${fp.substring(0, 10)}...`);
        this.logger.debug(`[JWT] Current FP: ${currentFp.substring(0, 10)}...`);
        this.logger.debug(`[JWT] UA: ${req.headers['user-agent']}`);
        this.logger.debug(
          `[JWT] IP: ${req.ip} (X-Forwarded-For: ${req.headers['x-forwarded-for']})`,
        );

        // In production, we might want to be stricter, but for now we just log
        throw new UnauthorizedException(
          'Device fingerprint mismatch. Please login again.',
        );
      } else {
        this.logger.debug(`[JWT] Fingerprint verified for user ${userId}`);
      }
    }

    // 3. [CRITICAL FIX] Validate User Exists in Database
    // Prevents "Foreign key constraint violated" if user was deleted but token is still valid.
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        permissions: true,
        whitelistedIps: true,
        tenantId: true,
        roles: {
          select: {
            role: {
              select: { name: true },
            },
          },
        },
      },
    });

    if (!user) {
      this.logger.warn(`[JWT] User ${userId} not found in database (Deleted?)`);
      throw new UnauthorizedException('User no longer exists');
    }

    const roleNames = user.roles.map((ur) => ur.role.name);

    // Decrypt whitelistedIps if encrypted
    let whitelistedIps = user.whitelistedIps;
    if (
      whitelistedIps &&
      typeof whitelistedIps === 'string' &&
      whitelistedIps.includes(':')
    ) {
      whitelistedIps = this.encryptionService.decryptObject(whitelistedIps);
    }

    return {
      id: user.id,
      userId: user.id,
      tenantId: user.tenantId,
      permissions: userId === user.id ? permissions : [],
      roles: roleNames,
      whitelistedIps: whitelistedIps,
      jti,
    };
  }
}
