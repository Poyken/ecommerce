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
 * - `animate-pulse`: Hiệu ứng nhấp nháy mờ dần.
 *
 * 3. FLEXIBILITY:
 * - Truyền `className` để thay đổi hình dáng (tròn, vuông, dài) tùy ý.
 * =====================================================================
 */

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-md bg-muted animate-pulse", className)}
      {...props}
    />
  );
}

export { Skeleton };
