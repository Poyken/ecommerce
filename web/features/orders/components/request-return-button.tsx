"use client";

import { GlassButton } from "@/components/shared/glass-button";
import { Link } from "@/i18n/routing";
import { RotateCcw } from "lucide-react";
import { useTranslations } from "next-intl";

interface RequestReturnButtonProps {
  orderId: string;
  className?: string;
}



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
