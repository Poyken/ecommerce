/**
 * =====================================================================
 * EDIT COUPON DIALOG - Form chỉnh sửa mã giảm giá
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. STATE INITIALIZATION:
 * - Khác với Create Form, Edit Form cần load dữ liệu có sẵn (`coupon` prop) vào state.
 * - Format lại ngày tháng (Date -> YYYY-MM-DD) để input date hiểu được.
 *
 * 2. DIRTY CHECKING (`isDirty`):
 * - Đây là kỹ thuật tối ưu UX/Performance.
 * - Chỉ cho phép nút "Save" sáng lên khi User thực sự có thay đổi dữ liệu.
 * - Giảm thiểu việc gọi API updates không cần thiết.
 *
 * 3. LOGIC:
 * - Tương tự Create Form nhưng gọi API `updateCouponAction` với ID.
 * =====================================================================
 */ 
"use client";

import { FormDialog } from "@/components/shared/form-dialog";
import { useToast } from "@/components/ui/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { updateCouponAction } from "@/features/admin/actions";
import { Coupon } from "@/types/models";
import { useTranslations } from "next-intl";
import { useMemo, useState, useTransition } from "react";
import {
  CouponFormFields,
  CouponFormData,
  validateCouponForm,
  prepareCouponPayload,
  formatDateForInput,
} from "./coupon-form-fields";

/**
 * =====================================================================
 * EDIT COUPON DIALOG - Dialog chỉnh sửa mã giảm giá
 * =====================================================================
 */

interface EditCouponDialogProps {
  coupon: Coupon;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditCouponDialog({
  coupon,
  open,
  onOpenChange,
}: EditCouponDialogProps) {
  const t = useTranslations("admin");
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<CouponFormData>({
    code: coupon.code,
    discountType: coupon.discountType as "PERCENTAGE" | "FIXED_AMOUNT",
    discountValue: String(coupon.discountValue),
    minOrderAmount: String(coupon.minOrderAmount || ""),
    maxDiscountAmount: String(coupon.maxDiscountAmount || ""),
    startDate: formatDateForInput(coupon.startDate),
    endDate: formatDateForInput(coupon.endDate),
    usageLimit: String(coupon.usageLimit || ""),
    isActive: coupon.isActive,
  });

  const isDirty = useMemo(() => {
    return (
      formData.code !== coupon.code ||
      formData.discountType !== coupon.discountType ||
      formData.discountValue !== String(coupon.discountValue) ||
      formData.minOrderAmount !== String(coupon.minOrderAmount || "") ||
      formData.maxDiscountAmount !== String(coupon.maxDiscountAmount || "") ||
      formData.startDate !== formatDateForInput(coupon.startDate) ||
      formData.endDate !== formatDateForInput(coupon.endDate) ||
      formData.usageLimit !== String(coupon.usageLimit || "") ||
      formData.isActive !== coupon.isActive
    );
  }, [formData, coupon]);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();

    const validationErrors = validateCouponForm(formData, t);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const payload = prepareCouponPayload(formData);

    startTransition(async () => {
      const result = await updateCouponAction(coupon.id, payload as any);
      if (result.success) {
        toast({ 
          variant: "success",
          title: t("success"), 
          description: t("coupons.successUpdate") 
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
      title={t("coupons.edit")}
      description={t("coupons.editDescription")}
      onSubmit={onSubmit}
      isPending={isPending}
      submitLabel={t("save")}
      maxWidth="sm:max-w-xl"
      disabled={!isDirty || !formData.code.trim() || !formData.discountValue}
    >
      <CouponFormFields
        formData={formData}
        setFormData={setFormData}
        errors={errors}
        setErrors={setErrors}
        isPending={isPending}
      />
      
      {/* Active Status Toggle */}
      <div className="flex items-center space-x-2 mt-4">
        <Checkbox
          id="isActive"
          name="isActive"
          checked={formData.isActive}
          onCheckedChange={(checked) =>
            setFormData({ ...formData, isActive: !!checked })
          }
        />
        <Label htmlFor="isActive">{t("coupons.activeLabel")}</Label>
      </div>
    </FormDialog>
  );
}
