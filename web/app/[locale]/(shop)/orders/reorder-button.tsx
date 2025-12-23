"use client";

import { reorderAction } from "@/actions/cart";
import { Button } from "@/components/atoms/button";
import { useToast } from "@/hooks/use-toast";
import { RotateCcw } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

/**
 * =====================================================================
 * REORDER BUTTON - Nút mua lại đơn hàng cũ
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. REORDER LOGIC:
 * - Cho phép người dùng thêm nhanh toàn bộ sản phẩm từ một đơn hàng cũ vào giỏ hàng hiện tại.
 * - Giúp tăng trải nghiệm người dùng (UX) và thúc đẩy doanh số (Retention).
 *
 * 2. USE TRANSITION:
 * - Sử dụng `useTransition` để bọc lấy Server Action (`reorderAction`).
 * - `isPending` giúp ta hiển thị trạng thái "Adding..." trên nút bấm, ngăn user click nhiều lần.
 *
 * 3. NAVIGATION AFTER ACTION:
 * - Sau khi thêm thành công, ta dùng `router.push("/cart")` để đưa người dùng đến trang giỏ hàng ngay lập tức.
 * =====================================================================
 */

interface ReorderButtonProps {
  orderId: string;
}

export function ReorderButton({ orderId }: ReorderButtonProps) {
  const t = useTranslations("reorder");
  const tToast = useTranslations("common.toast");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { toast } = useToast();

  const handleReorder = () => {
    startTransition(async () => {
      const res = await reorderAction(orderId);
      if (res.error) {
        toast({
          variant: "destructive",
          title: tToast("error"),
          description: res.error,
        });
      } else {
        window.dispatchEvent(new Event("cart_updated"));
        toast({
          variant: "success",
          title: t("successTitle"),
          description: t("successDesc"),
        });
        router.push("/cart");
      }
    });
  };

  return (
    <Button
      variant="outline"
      onClick={handleReorder}
      disabled={isPending}
      className="gap-2"
    >
      <RotateCcw size={16} />
      {isPending ? t("adding") : t("button")}
    </Button>
  );
}
