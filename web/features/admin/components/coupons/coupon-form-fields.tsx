"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { m } from "@/lib/animations";
import { AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";



export interface CouponFormData {
  code: string;
  discountType: "PERCENTAGE" | "FIXED_AMOUNT";
  discountValue: string;
  minOrderAmount: string;
  maxDiscountAmount: string;
  startDate: string;
  endDate: string;
  usageLimit: string;
  isActive?: boolean;
}

interface CouponFormFieldsProps {
  formData: CouponFormData;
  setFormData: (data: CouponFormData) => void;
  errors: Record<string, string>;
  setErrors: (errors: Record<string, string>) => void;
  isPending?: boolean;
}

export function CouponFormFields({
  formData,
  setFormData,
  errors,
  setErrors,
  isPending,
}: CouponFormFieldsProps) {
  const t = useTranslations("admin");

  return (
    <div className="grid gap-4 py-4">
      {/* Code */}
      <div className="grid gap-2">
        <Label htmlFor="code">{t("coupons.codeLabel")}</Label>
        <Input
          id="code"
          name="code"
          placeholder={t("coupons.codePlaceholder")}
          value={formData.code}
          onChange={(e) => {
            setFormData({ ...formData, code: e.target.value });
            if (errors.code) setErrors({ ...errors, code: "" });
          }}
          disabled={isPending}
          className={errors.code ? "border-destructive" : ""}
        />
        <AnimatePresence>
          {errors.code && (
            <m.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="text-xs text-destructive"
            >
              {errors.code}
            </m.p>
          )}
        </AnimatePresence>
      </div>

      {/* Discount Type & Value */}
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="discountType">{t("coupons.typeLabel")}</Label>
          <Select
            name="discountType"
            value={formData.discountType}
            onValueChange={(value) =>
              setFormData({
                ...formData,
                discountType: value as "PERCENTAGE" | "FIXED_AMOUNT",
              })
            }
            disabled={isPending}
          >
            <SelectTrigger id="discountType">
              <SelectValue placeholder={t("coupons.typeLabel")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="PERCENTAGE">
                {t("coupons.percentage")}
              </SelectItem>
              <SelectItem value="FIXED_AMOUNT">
                {t("coupons.fixedAmount")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="discountValue">{t("coupons.valueLabel")}</Label>
          <Input
            id="discountValue"
            name="discountValue"
            type="number"
            placeholder={t("coupons.valuePlaceholder")}
            value={formData.discountValue}
            onChange={(e) => {
              setFormData({ ...formData, discountValue: e.target.value });
              if (errors.discountValue)
                setErrors({ ...errors, discountValue: "" });
            }}
            disabled={isPending}
            className={errors.discountValue ? "border-destructive" : ""}
          />
          <AnimatePresence>
            {errors.discountValue && (
              <m.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="text-xs text-destructive"
              >
                {errors.discountValue}
              </m.p>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Min Order & Max Discount */}
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="minOrderAmount">{t("coupons.minOrderLabel")}</Label>
          <Input
            id="minOrderAmount"
            name="minOrderAmount"
            type="number"
            placeholder={t("coupons.minOrderPlaceholder")}
            value={formData.minOrderAmount}
            onChange={(e) =>
              setFormData({ ...formData, minOrderAmount: e.target.value })
            }
            disabled={isPending}
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="maxDiscountAmount">
            {t("coupons.maxDiscountLabel")}
          </Label>
          <Input
            id="maxDiscountAmount"
            name="maxDiscountAmount"
            type="number"
            placeholder={t("optional")}
            value={formData.maxDiscountAmount}
            onChange={(e) =>
              setFormData({
                ...formData,
                maxDiscountAmount: e.target.value,
              })
            }
            disabled={isPending}
          />
        </div>
      </div>

      {/* Start & End Date */}
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="startDate">{t("coupons.startDateLabel")}</Label>
          <Input
            id="startDate"
            name="startDate"
            type="datetime-local"
            value={formData.startDate}
            onChange={(e) => {
              setFormData({ ...formData, startDate: e.target.value });
              if (errors.startDate) setErrors({ ...errors, startDate: "" });
            }}
            disabled={isPending}
            className={errors.startDate ? "border-destructive" : ""}
          />
          <AnimatePresence>
            {errors.startDate && (
              <m.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="text-xs text-destructive"
              >
                {errors.startDate}
              </m.p>
            )}
          </AnimatePresence>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="endDate">{t("coupons.endDateLabel")}</Label>
          <Input
            id="endDate"
            name="endDate"
            type="datetime-local"
            value={formData.endDate}
            onChange={(e) => {
              setFormData({ ...formData, endDate: e.target.value });
              if (errors.endDate) setErrors({ ...errors, endDate: "" });
            }}
            disabled={isPending}
            className={errors.endDate ? "border-destructive" : ""}
          />
          <AnimatePresence>
            {errors.endDate && (
              <m.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="text-xs text-destructive"
              >
                {errors.endDate}
              </m.p>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Usage Limit */}
      <div className="grid gap-2">
        <Label htmlFor="usageLimit">{t("coupons.usageLimitLabel")}</Label>
        <Input
          id="usageLimit"
          name="usageLimit"
          type="number"
          placeholder={t("optional")}
          value={formData.usageLimit}
          onChange={(e) =>
            setFormData({ ...formData, usageLimit: e.target.value })
          }
          disabled={isPending}
        />
      </div>
    </div>
  );
}

/**
 * Format date for datetime-local input
 */
export function formatDateForInput(dateStr: string): string {
  const date = new Date(dateStr);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}

/**
 * Validate coupon form data
 */
export function validateCouponForm(
  formData: CouponFormData,
  t: (key: string) => string
): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!formData.code.trim()) errors.code = t("coupons.errorCodeRequired");
  if (!formData.discountValue)
    errors.discountValue = t("coupons.errorValueRequired");
  if (!formData.startDate)
    errors.startDate = t("coupons.errorStartDateRequired");
  if (!formData.endDate) errors.endDate = t("coupons.errorEndDateRequired");
  return errors;
}

/**
 * Convert form data to API payload
 */
export function prepareCouponPayload(formData: CouponFormData) {
  return {
    code: formData.code.trim(),
    discountType: formData.discountType,
    discountValue: Number(formData.discountValue),
    minOrderAmount: formData.minOrderAmount
      ? Number(formData.minOrderAmount)
      : undefined,
    maxDiscountAmount: formData.maxDiscountAmount
      ? Number(formData.maxDiscountAmount)
      : undefined,
    startDate: new Date(formData.startDate).toISOString(),
    endDate: new Date(formData.endDate).toISOString(),
    usageLimit: formData.usageLimit ? Number(formData.usageLimit) : undefined,
    isActive: formData.isActive,
  };
}
