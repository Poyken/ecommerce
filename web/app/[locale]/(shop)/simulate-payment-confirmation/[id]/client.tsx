"use client";

import { GlassCard } from "@/components/shared/glass-card";
import { useToast } from "@/components/shared/use-toast";
import { Button } from "@/components/ui/button";
import { simulatePaymentSuccessAction } from "@/features/orders/actions";
import { Check, CreditCard, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";

/**
 * =====================================================================
 * SIMULATE PAYMENT CLIENT - Công cụ giả lập thanh toán (DEV ONLY)
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. WHY THIS EXISTS?
 * - Để test flow thanh toán mà không cần thẻ tín dụng thật hay API Sandbox phức tạp.
 * - Chỉ nên bật ở môi trường Dev hoặc Staging.
 *
 * 2. SERVER ACTION CALL:
 * - Gọi `simulatePaymentSuccessAction` để update trạng thái đơn hàng thành PAID trong DB.
 * =====================================================================
 */

export function SimulatePaymentClient({ orderId }: { orderId: string }) {
  const t = useTranslations("simulatePayment");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      const res = await simulatePaymentSuccessAction(orderId);
      if (res.success) {
        toast({
          title: t("successTitle"),
          description: t("successDesc"),
          variant: "success",
        });
        // Redirect back to order details after a short delay
        setTimeout(() => {
          router.push(`/orders/${orderId}`);
        }, 1000);
      } else {
        toast({
          title: t("errorTitle"),
          description:
            res.error || "Failed to confirm payment. Ensure you are an Admin.",
          variant: "destructive",
        });
      }
    } catch (_error) {
      // console.error(error);
      toast({
        title: t("errorTitle"),
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-20 flex items-center justify-center min-h-[60vh]">
      <GlassCard className="max-w-md w-full p-8 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <CreditCard className="w-8 h-8 text-primary" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">{t("title")}</h1>
          <p className="text-muted-foreground">
            {t("description")}{" "}
            <span className="font-mono font-bold">#{orderId.slice(0, 8)}</span>
          </p>
        </div>

        <p className="text-xs text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400 p-3 rounded-lg">
          {t("devTool")}
        </p>

        <Button
          className="w-full h-12 text-base"
          onClick={handleConfirm}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t("processing")}
            </>
          ) : (
            <>
              <Check className="mr-2 h-4 w-4" />
              {t("confirmButton")}
            </>
          )}
        </Button>
      </GlassCard>
    </div>
  );
}
