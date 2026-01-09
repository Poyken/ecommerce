"use client";

import { updateCartItemAction } from "@/features/cart/actions";
import { Button } from "@/components/ui/button";
import { Minus, Plus } from "lucide-react";
import { useState, useTransition } from "react";

/**
 * =====================================================================
 * CART ITEM CONTROL - Bộ điều khiển số lượng sản phẩm
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. STOCK VALIDATION:
 * - Trước khi tăng số lượng, ta luôn kiểm tra `item.sku.stock`.
 * - Không cho phép user đặt quá số lượng tồn kho hiện có.
 *
 * 2. DUAL LOGIC (Guest vs User):
 * - Guest: Cập nhật trực tiếp vào `localStorage` và bắn event `guest_cart_updated`.
 * - User: Gọi Server Action `updateCartItemAction` để lưu vào database.
 *
 * 3. UX ENHANCEMENT:
 * - Sử dụng `useTransition` (`isPending`) để disable các nút bấm khi đang xử lý API, tránh việc user click quá nhanh gây lỗi race condition.
 * =====================================================================
 */

import { useToast } from "@/components/shared/use-toast";
import { CartItem } from "@/types/models";

export function CartItemControl({
  item,
  isGuest = false,
}: {
  item: CartItem;
  isGuest?: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const [quantity, setQuantity] = useState(item.quantity);
  const { toast } = useToast();

  const updateQuantity = async (newQuantity: number) => {
    if (newQuantity < 1) return;

    // Check stock
    const stock = item.sku?.stock ?? 0;
    if (newQuantity > stock) {
      toast({
        title: "Limit reached",
        description: `Only ${stock} items available in stock.`,
        variant: "destructive",
      });
      return;
    }

    setQuantity(newQuantity);

    // Phân biệt giữa guest cart và user cart
    if (isGuest) {
      // Logic cho Guest: Cập nhật localStorage
      const guestCart = JSON.parse(localStorage.getItem("guest_cart") || "[]");
      const itemIndex = guestCart.findIndex(
        (i: { skuId: string }) => i.skuId === item.skuId
      );

      if (itemIndex !== -1) {
        guestCart[itemIndex].quantity = newQuantity;
        localStorage.setItem("guest_cart", JSON.stringify(guestCart));
        // Dispatch event để cart page và badge cập nhật
        window.dispatchEvent(new Event("guest_cart_updated"));
      }
    } else {
      // Logic cho User đã đăng nhập: Gọi API
      startTransition(async () => {
        await updateCartItemAction({ itemId: item.id, quantity: newQuantity });
        window.dispatchEvent(new Event("cart_updated"));
      });
    }
  };

  return (
    <div className="flex items-center gap-2 border rounded-md">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 rounded-none"
        onClick={() => updateQuantity(quantity - 1)}
        disabled={quantity <= 1 || isPending}
      >
        <Minus size={14} />
      </Button>
      <span className="w-8 text-center text-sm">{quantity}</span>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 rounded-none"
        onClick={() => updateQuantity(quantity + 1)}
        disabled={isPending}
      >
        <Plus size={14} />
      </Button>
    </div>
  );
}
