import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Request } from 'express';

/**
 * =====================================================================
 * CSRF GUARD - Bảo vệ chống tấn công giả mạo (Cross-Site Request Forgery)
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * CSRF là gì?
 * - Là kỹ thuật tấn công khi một trang web độc hại lừa trình duyệt của người dùng
 *   thực hiện một yêu cầu (request) trái phép đến website của chúng ta.
 *
 * CƠ CHẾ BẢO VỆ:
 * 1. Double Submit Cookie Pattern:
 *    - Server tạo 1 token ngẫu nhiên và lưu vào Cookie (HttpOnly: false).
 *    - Client đọc token này và gửi lại trong Header của request (VD: X-CSRF-Token).
 *    - Server so sánh giá trị trong Header và Cookie. Nếu khớp mới cho thực thi.
 *
 * TẠI SAO AN TOÀN?
 * - Hacker có thể khiến trình duyệt gửi Cookie đi (tự động), nhưng Hacker
 *   KHÔNG THỂ đọc được Cookie (do cùng chính sách Same-Origin) để đưa vào Header.
 * =====================================================================
 */
@Injectable()
export class CsrfGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();

    // 1. Chỉ kiểm tra các phương thức làm thay đổi dữ liệu (State-changing)
    const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
    if (safeMethods.includes(request.method)) {
      return true;
    }

    // 2. Chế độ phát triển (Optional: disable nếu cần debug dễ dàng)
    // if (process.env.NODE_ENV !== 'production') return true;

    // 3. Trích xuất token từ Header và Cookie
    const csrfHeader = request.headers['x-csrf-token'];
    const csrfCookie = request.cookies['csrf-token'];

    if (!csrfHeader) {
      throw new ForbiddenException('CSRF Token missing in header');
    }

    if (!csrfCookie) {
      throw new ForbiddenException('CSRF Token missing in cookie');
    }

    // 4. So sánh (Double Submit Cookie validation)
    if (csrfHeader !== csrfCookie) {
      throw new ForbiddenException('CSRF Token mismatch');
    }

    return true;
  }
}
