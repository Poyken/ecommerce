import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';

/**
 * =====================================================================
 * ALL EXCEPTIONS FILTER - Bộ lọc xử lý lỗi toàn cục
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. CENTRALIZED ERROR HANDLING:
 * - Đây là "chốt chặn cuối cùng" cho mọi lỗi xảy ra trong ứng dụng.
 * - Thay vì để server "sập" hoặc trả về lỗi thô kệch, filter này sẽ bắt lấy và trả về một format JSON đẹp đẽ cho Client.
 *
 * 2. HTTP VS INTERNAL ERRORS:
 * - Nếu là `HttpException` (lỗi do ta chủ động throw like 404, 400), nó sẽ lấy status code tương ứng.
 * - Nếu là lỗi code không mong muốn (Crash), nó sẽ tự động chuyển thành `500 Internal Server Error`.
 *
 * 3. LOGGING FOR DEVS:
 * - Chỉ những lỗi 500 mới được ghi vào `logger.error` kèm theo `stack trace`. Giúp chúng ta biết chính xác dòng code nào bị lỗi để sửa.
 *
 * 4. SECURITY:
 * - Tránh việc để lộ thông tin nhạy cảm của server (như lỗi Database thô) ra ngoài Client bằng cách chuẩn hóa thông điệp lỗi.
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

    const httpStatus =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

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
