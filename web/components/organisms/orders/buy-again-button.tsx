/**
 * =====================================================================
 * BUY AGAIN BUTTON - Nút mua lại sản phẩm (Lịch sử đơn hàng)
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. QUICK RE-ORDER:
 * - Cho phép người dùng thêm nhanh sản phẩm từ đơn hàng cũ vào giỏ hàng.
 * - Sử dụng `useTransition` để xử lý trạng thái loading khi đang gọi API.
 *
 * 2. EVENT DISPATCHING:
 * - Sau khi thêm thành công, bắn ra event `cart_updated` để đồng bộ số lượng trên Header Badge.
 *
 * 3. NAVIGATION:
 * - Tự động chuyển hướng người dùng đến trang giỏ hàng (`/cart`) sau khi thêm thành công.
 * =====================================================================
 */

"use client";

import { addToCartAction } from "@/actions/cart";
import { Button } from "@/components/atoms/button";
import { useToast } from "@/hooks/use-toast";
import { ShoppingCart } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

interface BuyAgainButtonProps {
  skuId: string;
}

export function BuyAgainButton({ skuId }: BuyAgainButtonProps) {
  const t = useTranslations("orders"); // Assumes 'buyAgain' key exists or will use generic
  const tToast = useTranslations("common.toast");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { toast } = useToast();

  const handleBuyAgain = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent Link navigation if inside a Link
    e.stopPropagation();

    startTransition(async () => {
      try {
        const res = await addToCartAction(skuId, 1);
        if (res.success) {
          window.dispatchEvent(new Event("cart_updated"));
          toast({
            variant: "success",
            title: tToast("success"),
            description: t("addedToCart"),
          });
          router.push("/cart");
        } else {
          toast({
            variant: "destructive",
            title: tToast("error"),
            description: res.error || t("addToCartFailed"),
          });
        }
      } catch (error) {
        toast({
          variant: "destructive",
          title: tToast("error"),
          description: "Something went wrong",
        });
      }
    });
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleBuyAgain}
      disabled={isPending}
      className="gap-2 whitespace-nowrap"
    >
      <ShoppingCart size={14} />
      {isPending ? t("adding") : t("buyAgain")}
    </Button>
  );
}
