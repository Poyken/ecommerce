import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import * as winston from 'winston';

/**
 * LoggerService - Ghi log có cấu trúc chuẩn Production
 * Sử dụng Winston để ghi log có cấu trúc JSON.
 *
 * Tính năng:
 * - Định dạng JSON cho production
 * - Định dạng Console cho development
 * - Các mức log: error, warn, info, debug
 * - Hỗ trợ Correlation ID
 * - Metadata của request
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
