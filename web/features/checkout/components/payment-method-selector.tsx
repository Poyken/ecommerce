/**
 * =====================================================================
 * PAYMENT METHOD SELECTOR - Bộ chọn phương thức thanh toán
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. PAYMENT OPTIONS:
 * - Hỗ trợ nhiều phương thức: COD (Thanh toán khi nhận hàng), Chuyển khoản, VNPay.
 * - Mỗi phương thức có icon và mô tả chi tiết để người dùng dễ lựa chọn.
 *
 * 2. COMING SOON STATE:
 * - Các phương thức chưa hỗ trợ (như Credit Card trực tiếp) được làm mờ và gắn nhãn "Coming Soon".
 *
 * 3. INTERACTIVE FEEDBACK:
 * - Phương thức được chọn sẽ có viền màu `primary` và dấu `Check` xác nhận. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - User Experience: Cho phép người dùng chuyển đổi linh hoạt giữa các phương thức thanh toán phổ biến tại Việt Nam (VNPay, Momo, Chuyển khoản).
 * - Revenue Conversion: Việc tích hợp đa dạng cổng thanh toán giúp giảm tỷ lệ bỏ giỏ hàng (Cart Abandonment) do khách hàng không tìm thấy phương thức phù hợp.
 *
 * =====================================================================
 */

"use client";

import { GlassCard } from "@/components/shared/glass-card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@radix-ui/react-label";
import { Check, CreditCard, Landmark, Truck } from "lucide-react";
import { useTranslations } from "next-intl";

export type PaymentMethodType =
  | "COD"
  | "CARD"
  | "BANKING"
  | "VNPAY"
  | "MOMO"
  | "VIETQR";

interface PaymentMethodSelectorProps {
  method: PaymentMethodType;
  onChange: (method: PaymentMethodType) => void;
}

export function PaymentMethodSelector({
  method,
  onChange,
}: PaymentMethodSelectorProps) {
  const t = useTranslations("checkout");

  return (
    <GlassCard className="p-8 rounded-4xl border-foreground/5">
      <h2 className="text-2xl font-black flex items-center gap-3 mb-6 tracking-tight">
        <CreditCard className="text-primary w-7 h-7" /> {t("paymentMethod")}
      </h2>
      <RadioGroup
        value={method}
        onValueChange={(val) => onChange(val as PaymentMethodType)}
        className="space-y-4"
      >
        {/* COD Option */}
        <PaymentMethodOption
          value="COD"
          label={t("cod")}
          description={t("codDesc")}
          icon={
            <Truck
              className={
                method === "COD" ? "text-primary" : "text-muted-foreground"
              }
            />
          }
          checked={method === "COD"}
        />

        {/* Bank Transfer Option */}
        <PaymentMethodOption
          value="BANKING"
          label={t("banking")}
          description={t("bankingDesc")}
          icon={
            <Landmark
              className={
                method === "BANKING" ? "text-primary" : "text-muted-foreground"
              }
            />
          }
          checked={method === "BANKING"}
        />

        {/* VNPay Option */}
        <PaymentMethodOption
          value="VNPAY"
          label={t("vnpay")}
          description={t("vnpayDesc")}
          icon={
            <CreditCard
              className={
                method === "VNPAY" ? "text-primary" : "text-muted-foreground"
              }
            />
          }
          checked={method === "VNPAY"}
        />

        {/* Credit Card Option (Disabled) */}
        <div className="p-5 rounded-2xl border-2 border-foreground/5 opacity-50 cursor-not-allowed flex items-center gap-4 relative overflow-hidden grayscale bg-foreground/2">
          <div className="absolute top-3 right-3 px-3 py-1 bg-primary/20 text-primary text-[10px] font-black rounded-full uppercase tracking-[0.2em]">
            {t("comingSoon")}
          </div>
          <CreditCard className="w-7 h-7 text-muted-foreground/40" />
          <div className="flex-1">
            <p className="font-black text-base">{t("card")}</p>
            <p className="text-sm text-muted-foreground/60 font-medium">
              {t("visaMastercard")}
            </p>
          </div>
        </div>
      </RadioGroup>
    </GlassCard>
  );
}

interface PaymentMethodOptionProps {
  value: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  checked: boolean;
}

function PaymentMethodOption({
  value,
  label,
  description,
  icon,
  checked,
}: PaymentMethodOptionProps) {
  return (
    <div
      className={`relative flex items-center gap-4 p-5 rounded-2xl border-2 transition-all duration-300 cursor-pointer shadow-sm hover:shadow-lg ${
        checked
          ? "border-primary bg-primary/5 shadow-primary/10"
          : "border-foreground/5 hover:border-primary/30"
      }`}
    >
      <RadioGroupItem value={value} id={`payment-${value}`} className="mt-1" />
      <div className="flex-1 flex items-center gap-4">
        <div className="w-7 h-7 shrink-0">{icon}</div>
        <Label htmlFor={`payment-${value}`} className="flex-1 cursor-pointer">
          <div>
            <p className="font-black text-base tracking-tight">{label}</p>
            <p className="text-sm text-muted-foreground/70 font-medium">
              {description}
            </p>
          </div>
        </Label>
      </div>
      {checked && <Check className="text-primary w-6 h-6" />}
    </div>
  );
}
