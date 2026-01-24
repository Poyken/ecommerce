import { useToast } from "@/components/ui/use-toast";
import { addToCartAction } from "@/features/cart/actions";
import { useCartStore } from "@/features/cart/store/cart.store";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";

/**
 * USE CART HOOK - Hook xử lý hành động thêm vào giỏ hàng
 */

interface UseCartResult {
  addToCart: (skuId: string, quantity?: number) => Promise<boolean>;
  isAdding: boolean;
}

export function useCart(productName?: string): UseCartResult {
  const [isAdding, setIsAdding] = useState(false);
  const t = useTranslations("productCard");
  const tToast = useTranslations("common.toast");
  const { toast } = useToast();
  const { refreshCart, increment, updateCount } = useCartStore();

  const addToCart = useCallback(
    async (skuId: string, quantity: number = 1): Promise<boolean> => {
      if (isAdding) return false;
      setIsAdding(true);
      let addedSuccessfully = false;

      try {
        const result = await addToCartAction({ skuId, quantity });

        if (result.success) {
          increment(quantity);
          await refreshCart();
          addedSuccessfully = true;
        } else if (result.error) {
          const errorLower = result.error.toLowerCase();
          const isAuthError =
            result.error.includes("401") ||
            errorLower.includes("unauthorized") ||
            errorLower.includes("login") ||
            errorLower.includes("authenticated");

          if (!isAuthError) {
            toast({
              title: tToast("error"),
              description: result.error,
              variant: "destructive",
            });
            return false;
          }
        }

        if (!addedSuccessfully) {
          const guestCartRaw = localStorage.getItem("guest_cart");
          const guestCart = JSON.parse(guestCartRaw || "[]");

          const existingItemIndex = guestCart.findIndex(
            (item: { skuId: string; quantity: number }) => item.skuId === skuId
          );

          if (existingItemIndex > -1) {
            guestCart[existingItemIndex].quantity += quantity;
          } else {
            guestCart.push({ skuId, quantity });
          }

          localStorage.setItem("guest_cart", JSON.stringify(guestCart));

          const totalQuantity = guestCart.reduce(
            (sum: number, item: { quantity?: number }) => sum + (item.quantity || 0),
            0
          );
          updateCount(totalQuantity);
          addedSuccessfully = true;
        }

        toast({
          variant: "success",
          title: t("addedToCart"),
          description: productName
            ? t("addedToCartDesc", { name: productName })
            : t("addedToCart"),
        });

        return true;
      } catch (e) {
        console.error(e);
        toast({
          title: tToast("error"),
          description: t("errorGeneric"),
          variant: "destructive",
        });
        return false;
      } finally {
        setIsAdding(false);
      }
    },
    [isAdding, increment, refreshCart, updateCount, toast, t, tToast, productName]
  );

  return { addToCart, isAdding };
}
