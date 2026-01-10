"use client";

/**
 * =====================================================================
 * CANCEL ORDER BUTTON - Nút hủy đơn hàng cho user
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * Component này cho phép user hủy đơn hàng PENDING với lý do.
 * - Sử dụng AlertDialog để xác nhận trước khi hủy
 * - Bắt buộc nhập lý do hủy đơn
 * - Gọi cancelOrderAction và refresh trang
 * =====================================================================
 */

import { useToast } from "@/components/ui/use-toast";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface CancelOrderButtonProps {
  orderId: string;
}

export function CancelOrderButton({ orderId }: CancelOrderButtonProps) {
  const t = useTranslations("orders");
  const tCommon = useTranslations("common");
  const [isLoading, setIsLoading] = useState(false);
  const [reason, setReason] = useState("");
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleCancel = async () => {
    if (!reason.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for cancellation",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { cancelOrderWithReasonAction } = await import(
        "@/features/orders/actions"
      );
      const result = await cancelOrderWithReasonAction(orderId, reason);

      if (result.success) {
        toast({
          title: "Order Cancelled",
          description: "Your order has been cancelled successfully",
        });
        setOpen(false);
        router.refresh();
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to cancel order",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" className="gap-2">
          <X className="w-4 h-4" />
          {t("cancelOrder")}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="bg-background/95 backdrop-blur-xl border-border shadow-2xl">
        <AlertDialogHeader>
          <AlertDialogTitle>{t("confirmCancel")}</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. Please provide a reason for
            cancellation.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="py-4">
          <Textarea
            placeholder="Why do you want to cancel this order?"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="min-h-[100px]"
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel className="bg-transparent border-white/10 hover:bg-white/10">
            {tCommon("cancel")}
          </AlertDialogCancel>
          <Button
            onClick={handleCancel}
            disabled={isLoading || !reason.trim()}
            variant="destructive"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : null}
            {t("cancelOrder")}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
