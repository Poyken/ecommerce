/**
 * =====================================================================
 * SOCIAL CALLBACK PAGE - XỬ LÝ ĐĂNG NHẬP MẠNG XÃ HỘI
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * Sau khi người dùng đăng nhập qua Google/Facebook, họ sẽ được redirect về đây.
 * Component này nhận mã token từ URL và hoàn tất quá trình xác thực. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Đóng vai trò quan trọng trong kiến trúc hệ thống, hỗ trợ các chức năng nghiệp vụ cụ thể.

 * =====================================================================
 */

import { Metadata } from "next";
import { Suspense } from "react";
import { SocialCallbackClient } from "./social-callback-client";

export const metadata: Metadata = {
  title: "Social Login | Luxe",
};

export default function SocialCallbackPage() {
  return (
    <Suspense>
      <SocialCallbackClient />
    </Suspense>
  );
}
