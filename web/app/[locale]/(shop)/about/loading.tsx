import { AboutSkeleton } from "@/components/organisms/skeletons/about-skeleton";

/**
 * =====================================================================
 * LOADING UI - Giao diện chờ cho trang About
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * Trang About có nhiều ảnh lớn từ Unsplash, skeleton giúp user thấy
 * cấu trúc trang trong khi ảnh đang được tải, tránh việc layout bị giật.
 * =====================================================================
 */

export default function Loading() {
  return <AboutSkeleton />;
}
