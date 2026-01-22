import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import * as Sentry from '@sentry/nestjs';

/**
 * =====================================================================
 * ALL EXCEPTIONS FILTER - Bộ lọc xử lý lỗi toàn cục
 * =====================================================================
 *
 * =====================================================================
 */

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    if (host.getType() === 'ws') {
      const ctx = host.switchToWs();
      const client = ctx.getClient();
      const callback = host.getArgByIndex(2); // Ack callback is usually the 3rd arg

      const errorMsg =
        exception instanceof Error ? exception.message : 'Internal WS Error';

      this.logger.error(`[WS-Error] ${errorMsg}`, (exception as any).stack);

      // Verify if callback is a function (Ack)
      if (typeof callback === 'function') {
        callback({ success: false, error: errorMsg });
      } else {
        // If no ack, maybe emit an error event?
        // client.emit('error', { message: errorMsg });
      }
      return;
    }

    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();

    let httpStatus =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // Prisma Error Handling
    if ((exception as any).code === 'P2025') {
      httpStatus = HttpStatus.NOT_FOUND;
    } else if ((exception as any).code === 'P2002') {
      httpStatus = HttpStatus.CONFLICT;
    } else if ((exception as any).code === 'P2003') {
      httpStatus = HttpStatus.BAD_REQUEST; // Constraint violation
    }

    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : null;

    // Standardized Error Response Structure
    const responseBody = {
      success: false,
      error: {
        statusCode: httpStatus,
        message:
          exceptionResponse !== null &&
          typeof exceptionResponse === 'object' &&
          (exceptionResponse as any).message
            ? (exceptionResponse as any).message
            : exception instanceof Error
              ? exception.message
              : 'Internal Server Error',
        code:
          exception instanceof HttpException
            ? exception.name
            : 'INTERNAL_SERVER_ERROR',
        timestamp: new Date().toISOString(),
        path: httpAdapter.getRequestUrl(ctx.getRequest()),
      },
    };

    // Log critical errors with full stack trace
    if (httpStatus >= 500) {
      // Capture Exception to Sentry
      Sentry.captureException(exception, {
        extra: {
          path: httpAdapter.getRequestUrl(ctx.getRequest()),
          method: httpAdapter.getRequestMethod(ctx.getRequest()),
          body: ctx.getRequest().body,
          user: ctx.getRequest().user,
        },
      });

      this.logger.error(
        `[StandardError] ${httpAdapter.getRequestMethod(ctx.getRequest())} ${responseBody.error.path} - ${responseBody.error.message}`,
        exception instanceof Error ? exception.stack : '',
      );
    } else {
      this.logger.warn(
        `[StandardError] ${httpAdapter.getRequestMethod(ctx.getRequest())} ${responseBody.error.path} - ${responseBody.error.message}`,
      );
    }

    httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
  }
}
