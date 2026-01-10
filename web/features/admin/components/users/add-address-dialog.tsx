"use client";

import {
  createAddressAction,
  updateAddressAction,
} from "@/features/address/actions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { GlassButton } from "@/components/shared/glass-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Address } from "@/types/models";
import { m } from "@/lib/animations";
import { AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { useMemo, useState, useTransition } from "react";
import { LocationSelects } from "@/components/shared/location-selects";

/**
 * =====================================================================
 * ADD ADDRESS DIALOG - Form thêm/sửa địa chỉ giao hàng
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. DEPENDENT DROPDOWNS:
 * - Tỉnh/Thành -> Quận/Huyện -> Phường/Xã.
 * - Logic fetch dữ liệu địa lý đã được tách ra component `LocationSelects` để tái sử dụng.
 *
 * 2. UX IMPROVEMENTS:
 * - Framer Motion (`AnimatePresence`) giúp các thông báo lỗi xuất hiện/biến mất mượt mà.
 * =====================================================================
 */

interface AddAddressDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  address?: Address | null;
}

export function AddAddressDialog({
  open,
  onOpenChange,
  onSuccess,
  address,
}: AddAddressDialogProps) {
  const t = useTranslations();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] bg-background/95 backdrop-blur-xl border-border shadow-2xl p-6">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold bg-clip-text text-transparent bg-linear-to-r from-primary to-amber-500">
            {address ? t("addressForm.edit") : t("addressForm.add")}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {address
              ? t("addressForm.editDescription")
              : t("addressForm.addDescription")}
          </DialogDescription>
        </DialogHeader>
        <AddAddressForm
          key={open ? address?.id || "add" : "closed"}
          onOpenChange={onOpenChange}
          onSuccess={onSuccess}
          address={address}
        />
      </DialogContent>
    </Dialog>
  );
}

function AddAddressForm({
  onOpenChange,
  onSuccess,
  address,
}: {
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  address?: Address | null;
}) {
  const t = useTranslations();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    recipientName: address?.recipientName || "",
    phoneNumber: address?.phoneNumber || "",
    street: address?.street || "",
    city: address?.city || "",
    district: address?.district || "",
    ward: address?.ward || "",
    provinceId: address?.provinceId ?? undefined,
    districtId: address?.districtId ?? undefined,
    wardCode: address?.wardCode ?? undefined,
  });

  const isDirty = useMemo(() => {
    return (
      formData.recipientName !== (address?.recipientName || "") ||
      formData.phoneNumber !== (address?.phoneNumber || "") ||
      formData.street !== (address?.street || "") ||
      formData.provinceId !== address?.provinceId ||
      formData.districtId !== address?.districtId ||
      formData.wardCode !== address?.wardCode
    );
  }, [formData, address]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.recipientName.trim())
      newErrors.recipientName = t("addressForm.validation.required");
    if (!formData.phoneNumber.trim())
      newErrors.phoneNumber = t("addressForm.validation.required");
    if (!formData.street.trim())
      newErrors.street = t("addressForm.validation.required");
    if (!formData.provinceId)
      newErrors.provinceId = t("addressForm.validation.selectRequired");
    if (!formData.districtId)
      newErrors.districtId = t("addressForm.validation.selectRequired");
    if (!formData.wardCode)
      newErrors.wardCode = t("addressForm.validation.selectRequired");

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    startTransition(async () => {
      const form = new FormData();
      form.append("recipientName", formData.recipientName);
      form.append("phoneNumber", formData.phoneNumber);
      form.append("street", formData.street);
      form.append("city", formData.city);
      form.append("district", formData.district);
      form.append("ward", formData.ward);

      if (formData.provinceId)
        form.append("provinceId", String(formData.provinceId));
      if (formData.districtId)
        form.append("districtId", String(formData.districtId));
      if (formData.wardCode) form.append("wardCode", formData.wardCode);

      // Default logic (simplified)
      form.append("isDefault", address?.isDefault ? "on" : (!address ? "on" : "off"));

      let res;
      if (address) {
        res = await updateAddressAction(address.id, form);
      } else {
        res = await createAddressAction(form);
      }

      if (res.success) {
        toast({
          variant: "success",
          title: address
            ? t("addressForm.successUpdate")
            : t("addressForm.successAdd"),
        });
        onOpenChange(false);
        if (onSuccess) onSuccess();
      } else {
        toast({
          title: address
            ? t("addressForm.errorUpdate")
            : t("addressForm.errorAdd"),
          description: res.error,
          variant: "destructive",
        });
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 py-4">
      {/* Name & Phone */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="recipientName">{t("addressForm.nameLabel")}</Label>
          <Input
            id="recipientName"
            value={formData.recipientName}
            onChange={(e) => {
              setFormData({ ...formData, recipientName: e.target.value });
              if (errors.recipientName)
                setErrors({ ...errors, recipientName: "" });
            }}
            className={errors.recipientName ? "border-red-500" : ""}
          />
          <ErrorMessage message={errors.recipientName} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="phoneNumber">{t("addressForm.phoneLabel")}</Label>
          <Input
            id="phoneNumber"
            value={formData.phoneNumber}
            onChange={(e) => {
              setFormData({ ...formData, phoneNumber: e.target.value });
              if (errors.phoneNumber) setErrors({ ...errors, phoneNumber: "" });
            }}
            className={errors.phoneNumber ? "border-red-500" : ""}
          />
          <ErrorMessage message={errors.phoneNumber} />
        </div>
      </div>

      {/* Location Selects */}
      <LocationSelects 
        provinceId={formData.provinceId}
        districtId={formData.districtId}
        wardCode={formData.wardCode}
        onProvinceChange={(id, name) => setFormData({ 
          ...formData, 
          provinceId: id, city: name, 
          districtId: undefined, district: "", 
          wardCode: undefined, ward: "" 
        })}
        onDistrictChange={(id, name) => setFormData({ 
          ...formData, 
          districtId: id, district: name, 
          wardCode: undefined, ward: "" 
        })}
        onWardChange={(code, name) => setFormData({ 
          ...formData, 
          wardCode: code, ward: name 
        })}
        errors={errors}
        disabled={isPending}
        t={t}
      />
      <div className="grid grid-cols-3 gap-4 -mt-3">
        <ErrorMessage message={errors.provinceId} />
        <ErrorMessage message={errors.districtId} />
        <ErrorMessage message={errors.wardCode} />
      </div>

      {/* Street */}
      <div className="space-y-1">
        <Label htmlFor="street">{t("addressForm.streetLabel")}</Label>
        <Input
          id="street"
          value={formData.street}
          onChange={(e) => {
            setFormData({ ...formData, street: e.target.value });
            if (errors.street) setErrors({ ...errors, street: "" });
          }}
          placeholder={t("addressForm.streetPlaceholder")}
          className={errors.street ? "border-red-500" : ""}
        />
        <ErrorMessage message={errors.street} />
      </div>

      <DialogFooter className="mt-4">
        <GlassButton
          type="submit"
          disabled={isPending || !isDirty}
          className="bg-primary text-primary-foreground hover:bg-primary/90 w-full"
        >
          {address ? t("admin.save") : t("admin.create")}
        </GlassButton>
      </DialogFooter>
    </form>
  );
}

function ErrorMessage({ message }: { message?: string }) {
  return (
    <AnimatePresence mode="wait">
      {message && (
        <m.p
          initial={{ height: 0, opacity: 0, y: -5 }}
          animate={{ height: "auto", opacity: 1, y: 0 }}
          exit={{ height: 0, opacity: 0, y: -5 }}
          className="text-xs text-red-500 font-medium mt-1 overflow-hidden"
        >
          {message}
        </m.p>
      )}
    </AnimatePresence>
  );
}
