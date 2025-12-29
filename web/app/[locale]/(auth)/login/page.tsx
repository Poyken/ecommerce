import { LoginPageContent } from "@/features/auth/components/login-page-content";
import { Metadata } from "next";
import { Suspense } from "react";

/**
 * =====================================================================
 * LOGIN PAGE - Trang đăng nhập (Server Component)
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. SERVER COMPONENT & METADATA:
 * - File `page.tsx` mặc định là Server Component.
 * - `metadata`: Giúp định nghĩa tiêu đề và mô tả trang cho SEO. Vì là Server Component nên metadata được render trực tiếp vào HTML gửi về client.
 *
 * 2. SUSPENSE:
 * - Bọc `LoginPageContent` trong `Suspense` vì component này có sử dụng `useSearchParams()`.
 * - Trong Next.js, bất kỳ component nào dùng `useSearchParams()` đều cần được bọc trong Suspense để tránh lỗi khi render tĩnh (Static Rendering).
 *
 * 3. SEPARATION OF CONCERNS:
 * - Trang này chỉ đóng vai trò là "vỏ bọc" (Shell). Toàn bộ logic và UI phức tạp được tách ra `LoginPageContent` (Client Component).
 * =====================================================================
 */

export const metadata: Metadata = {
  title: "Sign In | Luxe",
  description: "Access your account to manage orders and preferences.",
};

export default function LoginPage() {
  // Force rebuild
  return (
    <Suspense>
      <LoginPageContent key="login" />
    </Suspense>
  );
}
