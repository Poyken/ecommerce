import { ExecutionContext, Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

/**
 * =====================================================================
 * CUSTOM THROTTLER GUARD - KIỂM SOÁT TẦN SUẤT GỌI API (RATE LIMITING)
 * =====================================================================
 *
 * =====================================================================
 */
@Injectable()
export class CustomThrottlerGuard extends ThrottlerGuard {
  protected getTracker(req: any): Promise<string> {
    return Promise.resolve(req.user?.id || req.ip);
  }

  protected getLimit(context: ExecutionContext): Promise<number> {
    const request = context.switchToHttp().getRequest();
    return Promise.resolve(request.user ? 100 : 20);
  }

  protected getTimeToLive(): Promise<number> {
    return Promise.resolve(60);
  }
}
