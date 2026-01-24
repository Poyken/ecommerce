

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
