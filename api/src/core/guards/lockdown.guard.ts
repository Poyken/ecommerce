/**
 * =====================================================================
 * LOCKDOWN.GUARD.TS
 * =====================================================================
 *
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
    try {
      const authHeader = request.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        const payload = this.jwtService.verify(token, {
          secret: this.configService.get<string>('JWT_ACCESS_SECRET'),
        });

        if (payload && Array.isArray(payload.permissions)) {
          if (
            payload.permissions.includes('super-admin:read') ||
            payload.permissions.includes('super-admin:update')
          ) {
            return true;
          }
        }
      }
    } catch (error) {
      // Token invalid or expired - progress to block
    }

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
    // 3. Otherwise, block access during lockdown
    throw new ServiceUnavailableException({
      statusCode: 503,
      message:
        'System is currently under emergency lockdown. Please try again later.',
      error: 'Service Unavailable',
    });
  }
}
