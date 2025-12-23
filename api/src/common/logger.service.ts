import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import * as winston from 'winston';

/**
 * =====================================================================
 * LOGGER SERVICE - Dịch vụ ghi nhật ký hệ thống (Winston)
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. STRUCTURED LOGGING:
 * - Thay vì dùng `console.log` đơn giản, ta dùng `Winston` để ghi log có cấu trúc (JSON).
 * - Giúp việc tìm kiếm và phân tích log trên các công cụ như ELK Stack hoặc CloudWatch trở nên dễ dàng.
 *
 * 2. ENV-BASED FORMATTING:
 * - Development: Log được định dạng có màu sắc (`colorize`) và dễ đọc cho con người.
 * - Production: Log được định dạng JSON để máy móc (Log Aggregator) dễ dàng xử lý.
 *
 * 3. LOG LEVELS:
 * - `error`: Lỗi nghiêm trọng cần xử lý ngay.
 * - `warn`: Cảnh báo các vấn đề tiềm ẩn.
 * - `info`: Thông tin hoạt động bình thường của hệ thống.
 * - `debug`: Thông tin chi tiết phục vụ việc gỡ lỗi (chỉ hiện ở môi trường Dev).
 *
 * 4. PERSISTENCE:
 * - Ở môi trường Production, log được ghi vào file (`logs/error.log`, `logs/combined.log`) để lưu trữ lâu dài.
 * =====================================================================
 */
@Injectable()
export class LoggerService implements NestLoggerService {
  private logger: winston.Logger;

  constructor() {
    const isProduction = process.env.NODE_ENV === 'production';

    this.logger = winston.createLogger({
      level: isProduction ? 'info' : 'debug',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        isProduction
          ? winston.format.json()
          : winston.format.combine(
              winston.format.colorize(),
              winston.format.printf(
                ({ level, message, timestamp, context, ...meta }) => {
                  const contextStr = context ? ` [${context}]` : '';
                  const metaStr = Object.keys(meta).length
                    ? ` ${JSON.stringify(meta)}`
                    : '';
                  return `${timestamp} [${level}]${contextStr} ${message}${metaStr}`;
                },
              ),
            ),
      ),
      transports: [
        new winston.transports.Console(),
        // Production: Thêm file transport
        ...(isProduction
          ? [
              new winston.transports.File({
                filename: 'logs/error.log',
                level: 'error',
              }),
              new winston.transports.File({
                filename: 'logs/combined.log',
              }),
            ]
          : []),
      ],
    });
  }

  log(message: string, context?: string) {
    this.logger.info(message, { context });
  }

  error(message: string, trace?: string, context?: string) {
    this.logger.error(message, { trace, context });
  }

  warn(message: string, context?: string) {
    this.logger.warn(message, { context });
  }

  debug(message: string, context?: string) {
    this.logger.debug(message, { context });
  }

  verbose(message: string, context?: string) {
    this.logger.verbose(message, { context });
  }

  /**
   * Ghi log HTTP request với metadata
   */
  logRequest(
    method: string,
    url: string,
    statusCode: number,
    duration: number,
  ) {
    this.logger.info('HTTP Request', {
      method,
      url,
      statusCode,
      duration: `${duration}ms`,
    });
  }

  /**
   * Ghi log lỗi với đầy đủ context
   */
  logError(error: Error, context?: Record<string, unknown>) {
    this.logger.error(error.message, {
      name: error.name,
      stack: error.stack,
      ...context,
    });
  }
}
