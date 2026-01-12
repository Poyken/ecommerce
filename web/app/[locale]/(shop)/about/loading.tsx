import { LoadingScreen } from "@/components/shared/loading-screen";

/**
 * =====================================================================
 * LOADING UI - Giao diện chờ cho trang About
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * Trang About có nhiều ảnh lớn từ Unsplash, skeleton giúp user thấy
 * cấu trúc trang trong khi ảnh đang được tải, tránh việc layout bị giật.
 *
 * UPDATE: Sử dụng LoadingScreen để đồng bộ trải nghiệm loading với Admin/Auth.
 * =====================================================================
 */

export default function Loading() {
  return <LoadingScreen fullScreen={false} className="min-h-screen" />;
}
