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
 * UPDATE: Sử dụng LoadingScreen để đồng bộ trải nghiệm loading với Admin/Auth.
 * =====================================================================
 */

export default function Loading() {
  return <LoadingScreen fullScreen={false} className="min-h-screen" />;
}
