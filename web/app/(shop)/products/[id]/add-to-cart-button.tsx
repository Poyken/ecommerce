"use client";

import { addToCartAction } from "@/actions/cart";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useTransition } from "react";

export function AddToCartButton({
  skuId,
  disabled,
  isLoggedIn,
}: {
  skuId: string;
  disabled?: boolean;
  isLoggedIn: boolean;
}) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleAddToCart = () => {
    console.log("Đã nhấn Thêm vào giỏ hàng, skuId:", skuId);
    if (!skuId) {
      console.error("Không có SKU ID!");
      return;
    }

    if (isLoggedIn) {
      startTransition(async () => {
        const res = await addToCartAction(skuId);
        if (res.success) {
          toast({
            title: "Added to cart",
            description: "Item has been added to your cart.",
          });
        } else {
          toast({
            title: "Error",
            description: res.error,
            variant: "destructive",
          });
        }
      });
    } else {
      // Guest Logic
      const guestCart = JSON.parse(localStorage.getItem("guest_cart") || "[]");
      const existingItem = guestCart.find((item: any) => item.skuId === skuId);

      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        guestCart.push({ skuId, quantity: 1 });
      }

      localStorage.setItem("guest_cart", JSON.stringify(guestCart));
      toast({
        title: "Saved to guest cart",
        description: "Login to sync your cart.",
      });
    }
  };

  return (
    <Button
      size="lg"
      className="w-full md:w-auto"
      onClick={handleAddToCart}
      disabled={disabled || isPending}
    >
      {isPending ? "Adding..." : "Add to Cart"}
    </Button>
  );
}
