"use client";

import { reorderAction } from "@/features/cart/actions";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { RotateCcw } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";



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
      const res = await reorderAction({ orderId });
      if (!res.success) {
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
