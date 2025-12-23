import { Controller } from '@nestjs/common';

/**
 * =====================================================================
 * APP CONTROLLER - Bộ điều hướng gốc của ứng dụng
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. ROOT CONTROLLER:
 * - Đây là Controller mặc định của ứng dụng.
 * - Thường ít được sử dụng trong các dự án thực tế vì các logic nghiệp vụ đã được chia nhỏ vào các module con (Auth, Product, Order...).
 *
 * 2. ROUTING:
 * - `@Controller()` không có tham số nghĩa là nó sẽ lắng nghe ở đường dẫn gốc (`/`).
 * =====================================================================
 */

@Controller()
export class AppController {
  constructor() {}
}
