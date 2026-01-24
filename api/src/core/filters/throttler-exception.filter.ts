import { Catch, ExceptionFilter, ArgumentsHost } from '@nestjs/common';
import { ThrottlerException } from '@nestjs/throttler';
import type { Response } from 'express';

/**
 * Custom exception filter for rate limiting violations
 * Provides user-friendly Vietnamese error messages
 */
@Catch(ThrottlerException)
export class ThrottlerExceptionFilter implements ExceptionFilter {
  catch(exception: ThrottlerException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    response.status(429).json({
      success: false,
      error: {
        statusCode: 429,
        message: 'Quá nhiều yêu cầu. Vui lòng thử lại sau ít phút.',
        code: 'TOO_MANY_REQUESTS',
        timestamp: new Date().toISOString(),
      },
    });
  }
}
