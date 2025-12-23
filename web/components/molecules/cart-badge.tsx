/**
 * =====================================================================
 * CART BADGE - Huy hiệu hiển thị số lượng sản phẩm trong giỏ hàng
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. CART CONTEXT:
 * - Lấy số lượng sản phẩm (`count`) từ `CartProvider`.
 * - Tự động cập nhật khi user thêm/xóa sản phẩm.
 *
 * 2. CONDITIONAL RENDERING:
 * - Nếu `count === 0`, component trả về `null` (không hiển thị gì cả).
 *
 * 3. ANIMATION:
 * - Sử dụng các utility classes của Tailwind (`animate-in zoom-in`) để tạo hiệu ứng xuất hiện sinh động.
 * =====================================================================
 */

"use client";

import { useCartContext } from "@/providers/cart-provider";

interface CartBadgeProps {
  initialUser?: any;
  initialCount?: number;
}

export function CartBadge({ initialUser, initialCount }: CartBadgeProps) {
  const { count } = useCartContext();

  // Không hiển thị badge nếu giỏ hàng trống
  if (count === 0) return null;

  return (
    <span className="absolute -top-1.5 -right-1.5 bg-primary text-primary-foreground text-[10px] font-black h-5 w-5 flex items-center justify-center rounded-full pointer-events-none animate-in zoom-in spin-in-90 duration-300 shadow-lg shadow-primary/50 border-2 border-background">
      {count}
    </span>
  );
}
