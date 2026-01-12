import { LoadingScreen } from "@/components/shared/loading-screen";

/**
 * =====================================================================
 * LOADING UI - Giao diện chờ cho trang Blog
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * Trang Blog fetch dữ liệu từ API, skeleton hiển thị trong lúc
 * chờ response từ backend.
 *
 * UPDATE: Sử dụng LoadingScreen để đồng bộ trải nghiệm loading với Admin/Auth. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Đóng vai trò quan trọng trong kiến trúc hệ thống, hỗ trợ các chức năng nghiệp vụ cụ thể.

 * =====================================================================
 */

export default function Loading() {
  return <LoadingScreen fullScreen={false} className="min-h-screen" />;
}
