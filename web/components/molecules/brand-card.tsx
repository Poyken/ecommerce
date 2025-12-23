"use client";

/**
 * =====================================================================
 * BRAND CARD - Card hiển thị thương hiệu
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. WRAPPER COMPONENT:
 * - Đây là một wrapper đơn giản quanh `NavCard`.
 * - Mục đích: Đặt tên rõ nghĩa (Semantic Naming) để code dễ đọc hơn.
 * - Thay vì gọi `NavCard` với `variant="brand"` ở khắp nơi, ta gọi `BrandCard`.
 * - Nếu sau này logic hiển thị Brand thay đổi, ta chỉ cần sửa ở đây.
 */
import { NavCard } from "@/components/atoms/nav-card";

interface BrandCardProps {
  id: string;
  name: string;
  count?: number;
  imageUrl?: string;
  className?: string;
}

export function BrandCard({
  id,
  name,
  count,
  imageUrl,
  className,
}: BrandCardProps) {
  return (
    <NavCard
      href={`/brands/${id}`}
      name={name}
      count={count}
      imageUrl={imageUrl}
      variant="brand"
      className={className}
    />
  );
}
