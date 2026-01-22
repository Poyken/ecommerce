import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Decimal } from '@prisma/client/runtime/library';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * =====================================================================
 * TRANSFORM INTERCEPTOR - Chuẩn hóa dữ liệu phản hồi (Response)
 * =====================================================================
 *
 * =====================================================================
 */

export interface Response<T> {
  statusCode: number;
  message: string;
  data: T;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  Response<T>
> {
  private readonly logger = new Logger(TransformInterceptor.name);

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    return next.handle().pipe(
      map((data) => {
        try {
          // [WS SUPPORT] If WebSocket, just return data directly (Gateway handles structure)
          if (context.getType() === 'ws') {
            return this.transformData(data);
          }

          const response = context.switchToHttp().getResponse();
          const statusCode = response.statusCode;

          const responseData = data?.data || data;
          const meta = data?.meta; // Trích xuất meta nếu tồn tại
          const message = data?.message || 'Success';

          return {
            statusCode: statusCode,
            message,
            data: this.transformData(responseData),
            meta, // Bao gồm meta trong phản hồi
          } as any;
        } catch (err) {
          this.logger.error('[TransformInterceptor] Error:', err.stack);
          throw err;
        }
      }),
    );
  }

  /**
   * Đệ quy duyệt object để transform các field đặc biệt (Vd: Decimal)
   */
  private transformData(data: any): any {
    if (data === null || data === undefined) {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map((item) => this.transformData(item));
    }

    if (this.isDecimal(data)) {
      return Number(data); // Hoặc data.toString() nếu muốn giữ độ chính xác tuyệt đối
    }

    if (typeof data === 'object') {
      // Xử lý Date object nếu cần, hiện tại giữ nguyên
      if (data instanceof Date) {
        return data;
      }

      const transformed = {};
      for (const key of Object.keys(data)) {
        transformed[key] = this.transformData(data[key]);
      }
      return transformed;
    }

    return data;
  }

  /**
   * Kiểm tra xem value có phải là Prisma Decimal không
   * Decimal thường là object hoặc instance của Decimal.js
   */
  private isDecimal(value: any): boolean {
    return (
      value instanceof Decimal ||
      (value &&
        typeof value === 'object' &&
        's' in value &&
        'e' in value &&
        'd' in value)
    );
  }
}
