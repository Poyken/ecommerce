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
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();

    const httpStatus =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const responseBody = {
      statusCode: httpStatus,
      timestamp: new Date().toISOString(),
      path: httpAdapter.getRequestUrl(ctx.getRequest()),
      message:
        exception instanceof HttpException
          ? exception.getResponse()
          : 'Internal Server Error',
    };

    if (httpStatus === HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `Exception: ${exception instanceof Error ? exception.message : exception}`,
        exception instanceof Error ? exception.stack : '',
      );
    }

    httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
  }
}
