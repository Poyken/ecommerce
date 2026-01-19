import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';

/**
 * =====================================================================
 * TOKEN SERVICE - QUẢN LÝ MÃ ĐỊNH DANH (JWT)
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. ACCESS TOKEN vs REFRESH TOKEN:
 * - `accessToken`: Dùng để xác thực mọi request gửi lên server. Có thời hạn ngắn (VD: 15 phút) để tăng tính bảo mật.
 * - `refreshToken`: Dùng để lấy `accessToken` mới khi cái cũ hết hạn mà không bắt user phải login lại. Có thời hạn dài (VD: 7 ngày).
 *
 * 2. FINGERPRINT (Dấu vân tay số):
 * - Ta lưu `fp` (Fingerprint) vào trong Payload của Token.
 * - Khi xác thực, ta so sánh `fp` trong Token với `fp` thực tế của thiết bị đang gửi request.
 * - Nếu hacker lấy được Token nhưng dùng ở thiết bị khác -> Token sẽ bị coi là vô hiệu.
 *
 * 3. JTI (JWT ID):
 * - Mỗi Token sinh ra có một mã `jti` duy nhất để tránh việc tái sử dụng Token (Replay Attack). *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Quản lý vòng đời của mã định danh (JWT), xử lý cấp mới (Rotation) và thu hồi (Revoke) quyền truy cập để đảm bảo an toàn cho tài khoản người dùng.

 * =====================================================================
 */

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  generateTokens(
    userId: string,
    permissions: string[] = [],
    roles: string[] = [],
    fingerprint?: string,
  ) {
    const jti = crypto.randomUUID();

    // Access Token Payload
    const accessPayload = {
      userId,
      permissions,
      roles,
      jti,
      fp: fingerprint, // Fingerprint (Hash of IP + UserAgent)
    };

    const accessToken = this.jwtService.sign(accessPayload, {
      secret: this.configService.get('JWT_ACCESS_SECRET') || 'access-secret',
      expiresIn: this.configService.get('JWT_ACCESS_EXPIRED') || '15m',
    });

    // Refresh Token Payload
    // Also include fingerprint to bind refresh token to the device
    const refreshPayload = {
      userId,
      jti: crypto.randomUUID(),
      fp: fingerprint,
    };

    const refreshToken = this.jwtService.sign(refreshPayload, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRED'),
    });

    return { accessToken, refreshToken };
  }

  getRefreshTokenExpirationTime(): number {
    const expiration =
      this.configService.get<string>('JWT_REFRESH_EXPIRED') || '7d';
    return this.parseDuration(expiration);
  }

  private parseDuration(duration: string): number {
    if (!duration) return 0;
    const match = String(duration).match(/^(\d+)([smhd])$/);
    if (!match) return parseInt(duration, 10) || 0;
    const value = parseInt(match[1], 10);
    const unit = match[2];
    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 3600;
      case 'd':
        return value * 86400;
      default:
        return value;
    }
  }

  validateRefreshToken(token: string) {
    try {
      return this.jwtService.verify(token, {
        secret: this.configService.get('JWT_REFRESH_SECRET') || '',
      });
    } catch (e) {
      return null;
    }
  }
}
