"use client";

import { addToCartAction } from "@/features/cart/actions";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useTranslations } from "next-intl";
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
  const t = useTranslations("product");
  const tToast = useTranslations("common.toast");
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleAddToCart = () => {
    // Xử lý sự kiện thêm vào giỏ
    if (!skuId) {
      // Nếu không có SKU ID thì không làm gì cả
      return;
    }

    if (isLoggedIn) {
      startTransition(async () => {
        const res = await addToCartAction({ skuId, quantity: 1 });
        if (res.success) {
          window.dispatchEvent(new Event("cart_updated"));
          toast({
            variant: "success",
            title: t("addedToCart"),
            description: t("addedToCartDesc"),
          });
        } else {
          toast({
            title: tToast("error"),
            description: res.error,
            variant: "destructive",
          });
        }
      });
    } else {
      // Guest Logic
      const guestCart = JSON.parse(localStorage.getItem("guest_cart") || "[]");
      const existingItem = guestCart.find(
        (item: { skuId: string; quantity: number }) => item.skuId === skuId
      );

      if (existingItem) {
        existingItem.quantity += 1;
      } else {
        guestCart.push({ skuId, quantity: 1 });
      }

      localStorage.setItem("guest_cart", JSON.stringify(guestCart));
      window.dispatchEvent(new Event("guest_cart_updated"));
      toast({
        variant: "info",
        title: t("savedToGuestCart"),
        description: t("savedToGuestCartDesc"),
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
      {isPending ? t("adding") : t("addToCart")}
    </Button>
  );
}
