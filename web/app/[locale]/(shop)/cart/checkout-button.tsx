"use client";

import { Button } from "@/components/atoms/button";
import Link from "next/link";
import { useTransition } from "react";

/**
 * =====================================================================
 * CHECKOUT BUTTON - Nút thanh toán thông minh
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. SELECTIVE CHECKOUT:
 * - User có thể chọn chỉ thanh toán một vài món trong giỏ hàng.
 * - Danh sách `itemIds` được truyền qua URL query params (`?items=id1,id2`).
 *
 * 2. DYNAMIC URL:
 * - Nếu không chọn món nào, nút sẽ bị disable.
 * - URL được sinh động dựa trên mảng `itemIds`.
 * =====================================================================
 */

export function CheckoutButton({ itemIds }: { itemIds: string[] }) {
  const [isPending] = useTransition();

  const checkoutUrl =
    itemIds.length > 0 ? `/checkout?items=${itemIds.join(",")}` : "/checkout";

  return (
    <Link href={checkoutUrl as any} className="w-full">
      <Button
        className="w-full bg-linear-to-r from-success to-success/80 hover:from-success/90 hover:to-success text-success-foreground font-semibold shadow-lg shadow-success/20"
        size="lg"
        disabled={isPending || itemIds.length === 0}
      >
        Checkout ({itemIds.length})
      </Button>
    </Link>
  );
}
