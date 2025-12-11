import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';

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
