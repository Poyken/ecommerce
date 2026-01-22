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
                const parts = cookie.trim().split('=');
                const key = parts[0];
                const value = parts.slice(1).join('=');
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
    // this.logger.debug(
    //   `[JwtStrategy] Validating JTI: ${jti}, Revoked status: ${isRevoked}`,
    // );
    // if (isRevoked) {
    //   throw new UnauthorizedException('Token revoked');
    // }

    // 2. Validate Device Fingerprint (Binding)
    // Skip fingerprint check in development mode to allow testing from different clients
    if (fp && process.env.NODE_ENV === 'production') {
      // Use SAME hash logic as AuthController via shared utility
      const currentFp = getFingerprint(req);

      if (fp !== currentFp) {
        // [PROD MODE] Strict fingerprint validation for security
        this.logger.warn(`[JWT] Fingerprint mismatch detected in production!`);
        this.logger.debug(`[JWT] Token FP: ${fp.substring(0, 10)}...`);
        this.logger.debug(`[JWT] Current FP: ${currentFp.substring(0, 10)}...`);
        this.logger.debug(`[JWT] UA: ${req.headers['user-agent']}`);
        this.logger.debug(
          `[JWT] IP: ${req.ip} (X-Forwarded-For: ${req.headers['x-forwarded-for']})`,
        );

        throw new UnauthorizedException(
          'Device fingerprint mismatch. Please login again.',
        );
      }
    } else if (fp && process.env.NODE_ENV !== 'production') {
      // [DEV MODE] Log warning but allow request to proceed
      const currentFp = getFingerprint(req);
      if (fp !== currentFp) {
        this.logger.debug(
          `[JWT] Fingerprint mismatch in dev mode (allowed): Token FP: ${fp.substring(0, 10)}..., Current FP: ${currentFp.substring(0, 10)}...`,
        );
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
