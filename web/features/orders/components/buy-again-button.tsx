

"use client";

import { addToCartAction } from "@/features/cart/actions";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
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
        const res = await addToCartAction({ skuId, quantity: 1 });
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
      } catch {
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
