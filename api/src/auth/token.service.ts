import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

/**
 * =====================================================================
 * TOKEN SERVICE - Dịch vụ quản lý mã định danh (JWT)
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. ACCESS TOKEN VS REFRESH TOKEN:
 * - `Access Token`: Dùng để xác thực các request thông thường. Có thời hạn ngắn (VD: 15 phút) để tăng tính bảo mật.
 * - `Refresh Token`: Dùng để lấy Access Token mới khi cái cũ hết hạn. Có thời hạn dài (VD: 7 ngày).
 *
 * 2. JWT PAYLOAD:
 * - Payload chứa `userId` và `permissions`. Đây là thông tin ta có thể tin tưởng vì nó đã được ký (Sign) bằng một Secret Key bí mật trên server.
 *
 * 3. DURATION PARSING:
 * - Hàm `parseDuration` giúp chuyển đổi các chuỗi cấu hình như "7d", "1h" thành số giây tương ứng để lưu vào Redis hoặc tính toán thời gian hết hạn.
 *
 * 4. SECURITY:
 * - Ta sử dụng các Secret Key khác nhau cho Access và Refresh Token (`JWT_ACCESS_SECRET` vs `JWT_REFRESH_SECRET`) để cô lập rủi ro nếu một trong hai bị lộ.
 * =====================================================================
 */

@Injectable()
export class TokenService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  generateTokens(userId: string, permissions: string[] = []) {
    const payload = { userId, permissions };
    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_ACCESS_SECRET'),
      expiresIn: this.configService.get('JWT_ACCESS_EXPIRED'),
    });
    const refreshToken = this.jwtService.sign(
      { userId },
      {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get('JWT_REFRESH_EXPIRED'),
      },
    );
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
