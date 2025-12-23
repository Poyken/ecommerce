import { BlogSkeleton } from "@/components/organisms/skeletons/blog-skeleton";

/**
 * =====================================================================
 * LOADING UI - Giao diện chờ cho trang Blog
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * Trang Blog fetch dữ liệu từ API, skeleton hiển thị trong lúc
 * chờ response từ backend.
 * =====================================================================
 */

export default function Loading() {
  return <BlogSkeleton />;
}
