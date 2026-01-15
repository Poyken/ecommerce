/**
 * =====================================================================
 * CLIENT ENVIRONMENT VARIABLES - Biến môi trường phía Client
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. KHI NÀO DÙNG?
 * - Dùng khi cần lấy các cấu hình như URL API, URL Socket... ở phía Frontend (React/Next.js).
 *
 * 2. TẠI SAO CẦN FILE NÀY?
 * - Thay vì gọi trực tiếp `process.env.NEXT_PUBLIC_...` rải rác khắp nơi, ta tập trung vào đây.
 * - Giúp dễ dàng set giá trị mặc định (fallback) nếu quên cấu hình `.env`.
 * - Đảm bảo tính nhất quán (Consistency).
 *
 * ⚠️ LƯU Ý:
 * - Chỉ các biến bắt đầu bằng `NEXT_PUBLIC_` mới lộ ra phía Client (Browser).
 * - Đừng để lộ API Key bí mật ở đây! *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Configuration Management: Giúp quản trị viên dễ dàng chuyển đổi URL API từ môi trường Local sang Staging hoặc Production chỉ qua file `.env`.
 * - Error Prevention: Ngăn chặn lỗi runtime do quên cấu hình nhờ cơ chế fallback (giá trị mặc định) thông minh.

 * =====================================================================
 */
/**
 * Centralized Environment Variables
 * Use this file to access environment variables throughout the application.
 * This ensures consistency and makes it easier to manage defaults.
 */

export const env = {
  NEXT_PUBLIC_API_URL:
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001",
  NEXT_PUBLIC_APP_URL:
    process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  NEXT_PUBLIC_SOCKET_URL:
    process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:8080",
  NODE_ENV: process.env.NODE_ENV || "development",
};
