import { addToCartAction } from "@/actions/cart";
import { useToast } from "@/hooks/use-toast";
import { useCartContext } from "@/providers/cart-provider";
import { useTranslations } from "next-intl";
import { useState } from "react";

/**
 * =====================================================================
 * USE CART HOOK - Hook xử lý thêm sản phẩm vào giỏ hàng
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. HYBRID CART STRATEGY:
 * - Ưu tiên gọi Server Action (`addToCartAction`) để lưu vào database nếu user đã login.
 * - Nếu chưa login (lỗi 401), tự động fallback lưu vào `localStorage` (Guest Cart).
 *
 * 2. OPTIMISTIC UPDATE:
 * - Sử dụng `increment` từ `CartContext` để cập nhật số lượng trên Badge ngay lập tức.
 * - Tạo cảm giác mượt mà, không phải chờ đợi phản hồi từ server.
 *
 * 3. SYNC MECHANISM:
 * - Sau khi thêm thành công, gọi `refreshCart()` để đảm bảo dữ liệu local đồng bộ với server.
 * - Dispatch event `guest_cart_updated` để các component khác (như Header) biết và cập nhật UI.
 * =====================================================================
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
  const { refreshCart, increment } = useCartContext();

  const addToCart = async (
    skuId: string,
    quantity: number = 1
  ): Promise<boolean> => {
    if (isAdding) return false;

    setIsAdding(true);
    let addedSuccessfully = false;

    try {
      // 1. Try API first (Server Action)
      const result = await addToCartAction(skuId, quantity);

      if (result.success) {
        // window.dispatchEvent(new Event("cart_updated")); // Legacy, replaced by Context
        increment(quantity); // Optimistic update
        await refreshCart(); // Sync with server consistency
        addedSuccessfully = true;
      } else if (result.error) {
        // Only fallback to guest if it's an auth error (401/Unauthorized)
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

      // 2. Fallback to Guest Cart (LocalStorage) if API failed due to auth
      if (!addedSuccessfully) {
        const guestCart = JSON.parse(
          localStorage.getItem("guest_cart") || "[]"
        );
        const existingItemIndex = guestCart.findIndex(
          (item: { skuId: string; quantity: number }) => item.skuId === skuId
        );

        if (existingItemIndex > -1) {
          guestCart[existingItemIndex].quantity += quantity;
        } else {
          guestCart.push({ skuId, quantity });
        }

        localStorage.setItem("guest_cart", JSON.stringify(guestCart));
        window.dispatchEvent(new Event("guest_cart_updated")); // Needed for Provider to listen
        increment(quantity);
        addedSuccessfully = true;
      }

      // 3. Show Success Toast
      toast({
        variant: "success",
        title: t("addedToCart"),
        description: productName
          ? t("addedToCartDesc", { name: productName })
          : t("addedToCart"),
      });

      return true;
    } catch {
      toast({
        title: tToast("error"),
        description: t("errorGeneric"),
        variant: "destructive",
      });
      return false;
    } finally {
      setIsAdding(false);
    }
  };

  return { addToCart, isAdding };
}
