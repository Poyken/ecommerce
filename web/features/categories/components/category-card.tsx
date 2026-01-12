"use client";

/**
 * =====================================================================
 * CATEGORY CARD - Card hiển thị danh mục sản phẩm
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. COMPONENT PROPS:
 * - Nhận `id`, `name`, `count`, `imageUrl` để hiển thị thông tin động.
 * - `count` là optional, chỉ hiển thị nếu có dữ liệu.
 *
 * 2. IMAGE OPTIMIZATION:
 * - Sử dụng `next/image` với `fill` và `object-cover` để ảnh luôn lấp đầy khung tròn mà không bị méo.
 * - `group-hover:scale-110`: Hiệu ứng zoom ảnh mượt mà.
 *
 * 3. INTERACTIVE UI:
 * - `ArrowRight` indicator chỉ xuất hiện và trượt vào khi hover (`opacity-0` -> `opacity-100`). *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Component giao diện (UI) tái sử dụng, đảm bảo tính nhất quán về thiết kế (Design System).

 * =====================================================================
 */

import { NavCard } from "@/components/shared/nav-card";

interface CategoryCardProps {
  id: string;
  name: string;
  count?: number;
  imageUrl?: string;
  className?: string;
}

export function CategoryCard({
  id,
  name,
  count,
  imageUrl,
  className,
}: CategoryCardProps) {
  return (
    <NavCard
      href={`/categories/${id}`}
      name={name}
      count={count}
      imageUrl={imageUrl || "/images/placeholders/category-placeholder.jpg"}
      variant="category"
      className={className}
    />
  );
}
