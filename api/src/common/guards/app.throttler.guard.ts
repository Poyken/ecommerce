import { Injectable } from '@nestjs/common';
import { ThrottlerGuard, ThrottlerRequest } from '@nestjs/throttler';

@Injectable()
export class AppThrottlerGuard extends ThrottlerGuard {
  // Override to dynamically determine limit based on user authentication
  // Note: This specific override signature depends on @nestjs/throttler version.
  // Assuming v5/v6 compatibility.

  protected async handleRequest(
    requestProps: ThrottlerRequest,
  ): Promise<boolean> {
    const { context } = requestProps;

    const req = context.switchToHttp().getRequest();
    const isUser = !!req.user;

    // Custom Limit Logic: Scaled up to support static site generation (SSG)
    // P0 Optimization: Increased from 100/20 to 1000 to prevent build failures.
    const effectiveLimit = isUser ? 2000 : 1000;

    return super.handleRequest({
      ...requestProps,
      limit: effectiveLimit,
    });
  }
}
