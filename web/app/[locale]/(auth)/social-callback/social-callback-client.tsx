// GIẢI THÍCH CHO THỰC TẬP SINH:
// =================================================================================================
// SOCIAL LOGIN CALLBACK - XỬ LÝ SAU KHI ĐĂNG NHẬP MẠNG XÃ HỘI
// =================================================================================================
//
// Đây là trang trung gian (Landing Page) mà người dùng được chuyển hướng về sau khi
// họ đăng nhập thành công với Google/Facebook.
//
// LUỒNG HOẠT ĐỘNG:
// 1. Backend đã set HTTP-Only Cookies chứa Token (trong quá trình redirect OAuth 2.0).
// 2. Trang này chỉ việc đọc tham số `redirect` từ URL (để biết người dùng muốn đi đâu tiếp).
// 3. Router thực hiện chuyển hướng client-side về trang đích (ví dụ: Dashboard).
//
// USER EXPERIENCE: Hiển thị `LoadingScreen` để người dùng không thấy màn hình trắng trơn
// trong lúc chờ điều hướng.
// ================================================================================================= 
"use client";

/**
 * Social callback client component - handles OAuth redirect *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Đóng vai trò quan trọng trong kiến trúc hệ thống, hỗ trợ các chức năng nghiệp vụ cụ thể.

 */
import { LoadingScreen } from "@/components/shared/loading-screen";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

export function SocialCallbackClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // The backend has already set cookies during the OAuth flow
    // We just need to redirect the user to their destination
    const redirectTo = searchParams.get("redirect") || "/";

    // Small delay to ensure cookies are set
    const timer = setTimeout(() => {
      router.replace(redirectTo as any);
    }, 500);

    return () => clearTimeout(timer);
  }, [router, searchParams]);

  return <LoadingScreen message="Đang xác thực..." />;
}
