"use client";

import { GlassButton } from "@/components/shared/glass-button";
import { Link } from "@/i18n/routing";
import { RotateCcw } from "lucide-react";
import { useTranslations } from "next-intl";

interface RequestReturnButtonProps {
  orderId: string;
  className?: string;
}

/**
 * =====================================================================
 * REQUEST RETURN BUTTON - Nút bắt đầu quy trình trả hàng
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. CONDITIONAL NAVIGATION:
 * - Sau khi đơn hàng đã giao (Delivered), khách hàng có quyền yêu cầu trả hàng/hoàn tiền.
 * - Nút này sẽ dẫn đến trang form RMA để user điền thông tin chi tiết.
 *
 * 2. REUSABILITY:
 * - Component nhỏ gọn, có thể đặt ở đầu trang Order Detail hoặc cạnh từng item.
 * =====================================================================
 */

export function RequestReturnButton({ orderId, className }: RequestReturnButtonProps) {
  const t = useTranslations("orders");

  return (
    <Link href={`/orders/${orderId}/return`}>
      <GlassButton
        variant="outline"
        className={className}
      >
        <RotateCcw className="w-4 h-4 mr-2" />
        {t("requestReturn")}
      </GlassButton>
    </Link>
  );
}
