import { ResetPasswordPageContent } from "@/features/auth/components/reset-password-page-content";
import { Metadata } from "next";
import { Suspense } from "react";

/**
 * =====================================================================
 * RESET PASSWORD PAGE - Trang đặt lại mật khẩu
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. TOKEN HANDLING:
 * - Trang này thường được truy cập từ link trong Email. URL sẽ có dạng `/reset-password?token=XYZ`.
 * - `ResetPasswordPageContent` sẽ lấy token này để gửi lên server xác thực.
 *
 * 2. SUSPENSE:
 * - Tương tự trang Login, việc sử dụng `useSearchParams()` để lấy token yêu cầu component phải được bọc trong `Suspense`.
 *
 * 3. SECURITY:
 * - Đây là bước cuối cùng trong luồng "Quên mật khẩu". Việc đặt lại mật khẩu thành công sẽ vô hiệu hóa token cũ.
 * =====================================================================
 */

export const metadata: Metadata = {
  title: "Reset Password | Luxe",
  description: "Create a new password for your Luxe account.",
};

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordPageContent key="reset-password" />
    </Suspense>
  );
}
