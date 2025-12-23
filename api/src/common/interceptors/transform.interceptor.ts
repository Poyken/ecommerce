import {
  CallHandler,
  ExecutionContext,
  Injectable,
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
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. UNIFIED RESPONSE FORMAT:
 * - Đảm bảo mọi API đều trả về một cấu trúc chung: `{ statusCode, message, data, meta }`.
 * - Giúp team Frontend dễ dàng xử lý dữ liệu vì cấu trúc luôn nhất quán.
 *
 * 2. PRISMA DECIMAL HANDLING:
 * - Prisma trả về kiểu `Decimal` cho các trường tiền tệ (Price). Tuy nhiên, JSON không hỗ trợ kiểu này.
 * - Interceptor này tự động duyệt qua dữ liệu và chuyển đổi tất cả các giá trị `Decimal` thành `Number` trước khi gửi về Client.
 *
 * 3. RECURSIVE TRANSFORMATION:
 * - Hàm `transformData` sử dụng đệ quy để xử lý mọi cấp độ của Object hoặc Array, đảm bảo không bỏ sót bất kỳ trường dữ liệu nào cần chuẩn hóa.
 *
 * 4. SEPARATION OF CONCERNS:
 * - Controller chỉ việc trả về dữ liệu thô từ Service. Việc "đóng gói" dữ liệu vào format chuẩn được giao cho Interceptor này.
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
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    return next.handle().pipe(
      map((data) => {
        const responseData = data?.data || data;
        const meta = data?.meta; // Trích xuất meta nếu tồn tại
        const message = data?.message || 'Success';

        return {
          statusCode: context.switchToHttp().getResponse().statusCode,
          message,
          data: this.transformData(responseData),
          meta, // Bao gồm meta trong phản hồi
        } as any;
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
