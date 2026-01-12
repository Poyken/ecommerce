import { Injectable } from '@nestjs/common';

/**
 * =====================================================================
 * APP SERVICE - Dịch vụ gốc của ứng dụng
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. ROOT SERVICE:
 * - Đây là service mặc định được tạo ra khi khởi tạo project NestJS.
 * - Thường được dùng cho các logic mang tính chất toàn cục hoặc kiểm tra trạng thái hệ thống (Health Check).
 *
 * 2. INJECTABLE:
 * - Decorator `@Injectable()` đánh dấu lớp này có thể được quản lý bởi NestJS IoC Container và có thể được "tiêm" (Inject) vào các lớp khác. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Tiếp nhận request từ Client, điều phối xử lý và trả về response.

 * =====================================================================
 */

@Injectable()
export class AppService {}
