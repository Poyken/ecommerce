/**
 * =====================================================================
 * CART BADGE - Huy hiệu hiển thị số lượng sản phẩm trong giỏ hàng
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. CART CONTEXT:
 * - Component này là một "Consumer" của `CartProvider`.
 * - Nó tự động lắng nghe sự thay đổi của `count` (số lượng item) mà không cần props truyền từ cha.
 *
 * 2. CONDITIONAL RENDERING:
 * - Nguyên tắc UX: "Don't show zero". Nếu giỏ hàng trống (`count === 0`), ta ẩn luôn badge.
 * - Giúp giao diện sạch sẽ, chỉ gây chú ý khi thực sự cần thiết.
 *
 * 3. TAILWIND ANIMATION PLUGINS:
 * - `animate-in zoom-in spin-in-90`: Các class này đến từ plugin `tailwindcss-animate`.
 * - Giúp tạo hiệu ứng xuất hiện (Entrance Animation) cực kỳ dễ dàng mà không cần viết keyframes CSS thủ công.
 *
 * 4. MEMOIZATION:
 * - Sử dụng `React.memo` để component chỉ render lại khi `count` thực sự thay đổi, tránh render thừa do cha re-render.
 * =====================================================================
 */

"use client";

import { useCartStore } from "@/features/cart/store/cart.store";
import { memo } from "react";

// Props kept for compatibility with parent component, but not used internally
interface CartBadgeProps {
  initialUser?: unknown;
  initialCount?: number;
}

export const CartBadge = memo(function CartBadge() {
  const { count } = useCartStore();

  // Không hiển thị badge nếu giỏ hàng trống
  if (count === 0) return null;

  return (
    <span className="absolute -top-1.5 -right-1.5 bg-primary text-primary-foreground text-[10px] font-black h-5 w-5 flex items-center justify-center rounded-full pointer-events-none animate-in zoom-in spin-in-90 duration-300 shadow-lg shadow-primary/50 border-2 border-background">
      {count}
    </span>
  );
});
