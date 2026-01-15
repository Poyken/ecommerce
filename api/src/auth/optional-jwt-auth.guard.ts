import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * =====================================================================
 * OPTIONAL JWT AUTH GUARD - XÁC THỰC TÙY CHỌN
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. HYBRID AUTHENTICATION (Xác thực lai):
 * - Thông thường Guard sẽ chặn đứng request nếu không có Token.
 * - Guard này linh hoạt hơn: Nếu có Token -> Gán thông tin User vào Request; Nếu KHÔNG có -> Vẫn cho đi tiếp (Request User sẽ là null).
 *
 * 2. USE CASE (Trường hợp sử dụng):
 * - Dùng cho các trang như Trang chủ, Danh sách sản phẩm: Cả khách vãng lai và thành viên đều xem được, nhưng nếu là thành viên thì ta hiển thị thêm giá ưu đãi hoặc sản phẩm gợi ý riêng. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Tiếp nhận request từ Client, điều phối xử lý và trả về response.

 * =====================================================================
 */

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  // Override handleRequest so that it doesn't throw an error if user is not found
  handleRequest(err: any, user: any) {
    if (err || !user) {
      return null;
    }
    return user;
  }
}
