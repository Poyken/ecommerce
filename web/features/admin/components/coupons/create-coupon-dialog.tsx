 
"use client";

import { createCouponAction } from "@/features/admin/actions";
import { FormDialog } from "@/components/shared/form-dialog";
import { useToast } from "@/components/ui/use-toast";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import {
  CouponFormFields,
  CouponFormData,
  validateCouponForm,
  prepareCouponPayload,
} from "./coupon-form-fields";

/**
 * =====================================================================
 * CREATE COUPON DIALOG - Dialog tạo mã giảm giá mới
 * =====================================================================
 */

interface CreateCouponDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const INITIAL_FORM_DATA: CouponFormData = {
  code: "",
  discountType: "PERCENTAGE",
  discountValue: "",
  minOrderAmount: "",
  maxDiscountAmount: "",
  startDate: "",
  endDate: "",
  usageLimit: "",
};

export function CreateCouponDialog({
  open,
  onOpenChange,
}: CreateCouponDialogProps) {
  const t = useTranslations("admin");
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<CouponFormData>(INITIAL_FORM_DATA);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();

    const validationErrors = validateCouponForm(formData, t);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    const payload = prepareCouponPayload(formData);

    startTransition(async () => {
      const result = await createCouponAction(payload as any);
      if (result.success) {
        toast({ 
          variant: "success",
          title: t("success"), 
          description: t("coupons.successCreate") 
        });
        setFormData(INITIAL_FORM_DATA);
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
      <CouponFormFields
        formData={formData}
        setFormData={setFormData}
        errors={errors}
        setErrors={setErrors}
        isPending={isPending}
      />
    </FormDialog>
  );
}
