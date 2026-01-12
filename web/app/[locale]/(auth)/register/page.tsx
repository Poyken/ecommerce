import { RegisterPageContent } from "@/features/auth/components/register-page-content";
import { Metadata } from "next";

/**
 * =====================================================================
 * REGISTER PAGE - Trang đăng ký tài khoản
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. USER ONBOARDING:
 * - Trang này là điểm bắt đầu cho khách hàng mới.
 * - `RegisterPageContent` xử lý form đăng ký với các bước kiểm tra dữ liệu (Validation).
 *
 * 2. SEO OPTIMIZATION:
 * - `metadata`: Định nghĩa tiêu đề "Create Account" giúp trang trông chuyên nghiệp hơn trên tab trình duyệt và kết quả tìm kiếm.
 *
 * 3. CLEAN ARCHITECTURE:
 * - Tách biệt hoàn toàn phần định nghĩa trang (Server Component) và phần xử lý logic/UI (Client Component). *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Đóng vai trò quan trọng trong kiến trúc hệ thống, hỗ trợ các chức năng nghiệp vụ cụ thể.

 * =====================================================================
 */

export const metadata: Metadata = {
  title: "Create Account | Luxe",
  description:
    "Join Luxe to access exclusive products and personalized recommendations.",
};

export default function RegisterPage() {
  return <RegisterPageContent key="register" />;
}
