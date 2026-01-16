"use client";

import { cn } from "@/lib/utils";

/**
 * =====================================================================
 * SKELETON - Khung xương giả lập trạng thái loading
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. UX LOADING STRATEGY:
 * - Thay vì dùng Spinner xoay tròn truyền thống, Skeleton tạo cảm giác trang web load nhanh hơn.
 * - Giảm bớt sự khó chịu của người dùng khi phải chờ đợi dữ liệu từ API.
 *
 * 2. ANIMATION:
 * - Shimmer effect: Hiệu ứng luồng sáng chạy qua để báo hiệu đang tải.
 *
 * 3. FLEXIBILITY (NEW):
 * - Thêm các variant `glass` và `luxury` để phù hợp với hệ thống Quiet Luxury mới.
 *
 * =====================================================================
 */

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "glass" | "luxury";
}

function Skeleton({
  className,
  variant = "default",
  ...props
}: SkeletonProps) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md transition-all duration-300",
        variant === "default" && "bg-muted/50",
        variant === "glass" && "bg-white/5 backdrop-blur-md border border-white/5",
        variant === "luxury" && "bg-gradient-to-r from-white/5 via-white/10 to-white/5",
        "after:absolute after:inset-0 after:-translate-x-full after:animate-[shimmer_2s_infinite] after:bg-linear-to-r after:from-transparent after:via-white/10 after:to-transparent dark:after:via-white/5",
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
