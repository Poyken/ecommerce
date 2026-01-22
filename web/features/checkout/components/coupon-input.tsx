

"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Coupon } from "@/types/models";
import { m } from "@/lib/animations";
import { AnimatePresence } from "framer-motion";
import { TicketPercent, X } from "lucide-react";
import { useTranslations } from "next-intl";

interface CouponInputProps {
  couponCode: string;
  onCodeChange: (code: string) => void;
  availableCoupons: Coupon[];
  appliedCoupon: { code: string; discount: number } | null;
  isValidating: boolean;
  onApply: (code?: string) => void;
  onRemove: () => void;
  error?: string;
  formatMoney: (val: number) => string;
}

export function CouponInput({
  couponCode,
  onCodeChange,
  availableCoupons,
  appliedCoupon,
  isValidating,
  onApply,
  onRemove,
  error,
  formatMoney,
}: CouponInputProps) {
  const t = useTranslations("checkout");

  return (
    <div className="space-y-2">
      {appliedCoupon ? (
        <div className="flex gap-2 w-full">
          <Input
            value={appliedCoupon.code}
            disabled
            className="bg-green-500/10 border-green-500/20 text-green-500 font-bold"
          />
          <Button
            variant="destructive"
            size="icon"
            onClick={onRemove}
            className="shrink-0"
          >
            <X size={16} />
          </Button>
        </div>
      ) : (
        <div className="flex gap-2 w-full">
          <Select
            value={couponCode}
            onValueChange={(val) => {
              onCodeChange(val);
              onApply(val);
            }}
            disabled={isValidating}
          >
            <SelectTrigger className="w-full bg-background/50 border-white/10">
              <SelectValue
                placeholder={t("selectCoupon") || "Select a coupon"}
              />
            </SelectTrigger>
            <SelectContent>
              {availableCoupons.length > 0 ? (
                availableCoupons.map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    {c.code} -{" "}
                    {c.discountType === "PERCENTAGE"
                      ? `${c.discountValue}%`
                      : formatMoney(Number(c.discountValue))}{" "}
                    off
                  </SelectItem>
                ))
              ) : (
                <div className="p-2 text-sm text-muted-foreground text-center">
                  No coupons available
                </div>
              )}
            </SelectContent>
          </Select>
        </div>
      )}

      <AnimatePresence mode="wait">
        {error && (
          <m.p
            initial={{ height: 0, opacity: 0, marginTop: 0 }}
            animate={{ height: "auto", opacity: 1, marginTop: 4 }}
            exit={{ height: 0, opacity: 0, marginTop: 0 }}
            className="text-xs text-red-500 font-medium overflow-hidden"
          >
            {error}
          </m.p>
        )}

        {appliedCoupon && (
          <m.div
            initial={{ height: 0, opacity: 0, marginTop: 0 }}
            animate={{ height: "auto", opacity: 1, marginTop: 8 }}
            exit={{ height: 0, opacity: 0, marginTop: 0 }}
            className="overflow-hidden"
          >
            <div className="flex justify-between items-center text-sm text-green-500 bg-green-500/10 px-3 py-2 rounded-lg border border-green-500/20">
              <span className="flex items-center gap-2">
                <TicketPercent size={14} />
                {t("couponApplied")}: {appliedCoupon.code}
              </span>
              <span>-{formatMoney(appliedCoupon.discount)}</span>
            </div>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
