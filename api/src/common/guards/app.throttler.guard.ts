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

    // Custom Limit Logic: User gets 100, Guest gets 20.
    const effectiveLimit = isUser ? 100 : 20;

    return super.handleRequest({
      ...requestProps,
      limit: effectiveLimit,
    });
  }
}
