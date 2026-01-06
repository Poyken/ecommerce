/**
 * =====================================================================
 * LOCKDOWN.GUARD.TS
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * [Mô tả ngắn gọn mục đích của file]
 *
 * 1. CHỨC NĂNG:
 *    - [Mô tả các chức năng chính]
 *
 * 2. CÁCH SỬ DỤNG:
 *    - [Hướng dẫn sử dụng]
 * =====================================================================
 */

import {
  CanActivate,
  ExecutionContext,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { FeatureFlagsService } from '@/common/feature-flags/feature-flags.service';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class LockdownGuard implements CanActivate {
  constructor(
    private readonly featureFlagsService: FeatureFlagsService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isLockdown =
      await this.featureFlagsService.isEnabled('SYSTEM_LOCKDOWN');
    if (!isLockdown) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const path = request.path;

    // 1. Always allow health checks and auth login/logout/refresh
    if (
      path.includes('/health') ||
      path.includes('/auth/login') ||
      path.includes('/auth/logout') ||
      path.includes('/auth/refresh') ||
      path.includes('/admin/security') // Allow security hub to toggle it off
    ) {
      return true;
    }

    // 2. Try to extract user from JWT to check for Admin status
    try {
      const authHeader = request.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        const payload = this.jwtService.verify(token, {
          secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
        });

        if (
          payload &&
          (payload.role === 'ADMIN' || payload.role === 'SUPER_ADMIN')
        ) {
          return true;
        }
      }
    } catch (error) {
      // Token invalid or expired - progress to block
    }

    // 3. Otherwise, block access during lockdown
    throw new ServiceUnavailableException({
      statusCode: 503,
      message:
        'System is currently under emergency lockdown. Please try again later.',
      error: 'Service Unavailable',
    });
  }
}
