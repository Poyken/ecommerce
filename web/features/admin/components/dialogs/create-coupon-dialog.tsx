"use client";

import { createCouponAction } from "@/features/admin/actions";
import { FormDialog } from "@/components/shared/form-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { m } from "@/lib/animations";
import { AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

/**
 * =====================================================================
 * CREATE COUPON DIALOG - Dialog tạo mã giảm giá mới
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. COMPLEX FORM STATE:
 * - Quản lý nhiều trường dữ liệu: code, loại giảm giá (%, cố định), giá trị, hạn mức, ngày bắt đầu/kết thúc.
 * - Sử dụng một object `formData` duy nhất để quản lý tất cả các trường.
 *
 * 2. DATE HANDLING:
 * - Sử dụng `datetime-local` input để chọn thời gian chính xác.
 * - Chuyển đổi sang `ISOString` trước khi gửi về server.
 *
 * 3. VALIDATION:
 * - Kiểm tra kỹ các trường bắt buộc và định dạng dữ liệu trước khi gọi API.
 * =====================================================================
 */

interface CreateCouponDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateCouponDialog({
  open,
  onOpenChange,
}: CreateCouponDialogProps) {
  const t = useTranslations("admin");
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    code: "",
    discountType: "PERCENTAGE" as "PERCENTAGE" | "FIXED_AMOUNT",
    discountValue: "",
    minOrderAmount: "",
    maxDiscountAmount: "",
    startDate: "",
    endDate: "",
    usageLimit: "",
  });

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.code.trim()) newErrors.code = t("coupons.errorCodeRequired");
    if (!formData.discountValue)
      newErrors.discountValue = t("coupons.errorValueRequired");
    if (!formData.startDate)
      newErrors.startDate = t("coupons.errorStartDateRequired");
    if (!formData.endDate)
      newErrors.endDate = t("coupons.errorEndDateRequired");

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!validate()) return;

    const data = {
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
    };

    startTransition(async () => {
      const result = await createCouponAction(data as any);
      if (result.success) {
        toast({ title: t("success"), description: t("coupons.successCreate") });
        // Reset form
        setFormData({
          code: "",
          discountType: "PERCENTAGE",
          discountValue: "",
          minOrderAmount: "",
          maxDiscountAmount: "",
          startDate: "",
          endDate: "",
          usageLimit: "",
        });
        onOpenChange(false);
      } else {
        toast({
          title: t("error"),
          description: result.error,
          variant: "destructive",
        });
      }
    });
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("coupons.createNew")}
      description={t("coupons.description")}
      onSubmit={onSubmit}
      isPending={isPending}
      submitLabel={t("coupons.createNew")}
      maxWidth="sm:max-w-xl"
      disabled={
        !formData.code.trim() ||
        !formData.discountValue ||
        !formData.startDate ||
        !formData.endDate
      }
    >
      <div className="grid gap-4 py-4">
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
            />
          </div>
        </div>
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
          />
        </div>
      </div>
    </FormDialog>
  );
}
