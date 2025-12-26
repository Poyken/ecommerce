import { ForgotPasswordPageContent } from "@/features/auth/components/forgot-password-page-content";
import { Metadata } from "next";

/**
 * =====================================================================
 * FORGOT PASSWORD PAGE - Trang quên mật khẩu
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. PASSWORD RECOVERY FLOW:
 * - Đây là bước đầu tiên để khôi phục tài khoản. User nhập email, hệ thống sẽ gửi một link reset kèm token.
 * - `ForgotPasswordPageContent` xử lý việc gửi yêu cầu này.
 *
 * 2. USER EXPERIENCE (UX):
 * - Trang này cần đơn giản, tập trung vào một mục tiêu duy nhất: Nhập email.
 * - Tránh các thành phần gây xao nhãng để user hoàn thành quy trình nhanh nhất.
 *
 * 3. SECURITY:
 * - Không nên thông báo rõ ràng "Email này không tồn tại" để tránh việc kẻ xấu dò tìm danh sách email của hệ thống.
 * - Thông thường sẽ báo "Nếu email tồn tại, một liên kết đã được gửi đi".
 * =====================================================================
 */

export const metadata: Metadata = {
  title: "Forgot Password | Luxe",
  description: "Reset your password to regain access to your account.",
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordPageContent key="forgot-password" />;
}
