"use client";

import {
  createAddressAction,
  updateAddressAction,
} from "@/features/address/actions";
import {
  District,
  Province,
  Ward,
  getDistricts,
  getProvinces,
  getWards,
} from "@/features/shipping/actions";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/shared/use-toast";
import { Address } from "@/types/models";
import { m } from "@/lib/animations";
import { AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState, useTransition } from "react";

/**
 * =====================================================================
 * ADD ADDRESS DIALOG - Form thêm/sửa địa chỉ giao hàng
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. DEPENDENT DROPDOWNS:
 * - Tỉnh/Thành -> Quận/Huyện -> Phường/Xã.
 * - Dữ liệu được fetch từ API `/shipping` thông qua Server Actions để đảm bảo tính nhất quán.
 *
 * 2. UX IMPROVEMENTS:
 * - Sử dụng Server Actions giúp xử lý phía server, tránh lộ API key và lỗi CORS.
 * - Framer Motion (`AnimatePresence`) giúp các thông báo lỗi xuất hiện/biến mất mượt mà.
 * =====================================================================
 */

interface AddAddressDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  address?: Address | null; // Strict typing
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

  // Location Data State
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    recipientName: address?.recipientName || "",
    phoneNumber: address?.phoneNumber || "",
    street: address?.street || "",
    city: address?.city || "",
    district: address?.district || "",
    ward: address?.ward || "",
    // ID fields
    provinceId: address?.provinceId || (undefined as number | undefined),
    districtId: address?.districtId || (undefined as number | undefined),
    wardCode: address?.wardCode || (undefined as string | undefined),
  });

  // 1. Fetch Provinces on Mount (and Districts/Wards if editing)
  useEffect(() => {
    const fetchData = async () => {
      try {
        const list = await getProvinces();
        setProvinces(list);

        // If editing an address, pre-fetch districts and wards
        if (address?.provinceId) {
          const districtList = await getDistricts(address.provinceId);
          setDistricts(districtList);

          if (address?.districtId) {
            const wardList = await getWards(address.districtId);
            setWards(wardList);
          }
        }
      } catch (err) {
        console.error("Fetch provinces error:", err);
      }
    };
    fetchData();
  }, [address?.provinceId, address?.districtId]);

  // 2. Fetch Districts when Province Changes
  useEffect(() => {
    const fetchData = async () => {
      if (formData.provinceId) {
        try {
          const list = await getDistricts(formData.provinceId);
          setDistricts(list);
        } catch (err) {
          console.error(err);
          setDistricts([]);
        }
      } else {
        setDistricts([]);
      }
    };
    fetchData();
  }, [formData.provinceId]);

  // 3. Fetch Wards when District Changes
  useEffect(() => {
    const fetchData = async () => {
      if (formData.districtId) {
        try {
          const list = await getWards(formData.districtId);
          setWards(list);
        } catch (err) {
          console.error(err);
          setWards([]);
        }
      } else {
        setWards([]);
      }
    };
    fetchData();
  }, [formData.districtId]);

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
      if (!address) {
        form.append("isDefault", "on");
      } else if (address.isDefault) {
        form.append("isDefault", "on");
      }

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
      <div className="grid grid-cols-3 gap-4">
        {/* PROVINCE */}
        <div className="space-y-1">
          <Label>{t("addressForm.cityLabel")}</Label>
          <Select
            value={formData.provinceId?.toString()}
            onValueChange={(val) => {
              const province = provinces.find(
                (p) => p.ProvinceID.toString() === val
              );
              setFormData({
                ...formData,
                provinceId: Number(val),
                city: province?.ProvinceName || "",
                districtId: undefined, // Reset child
                district: "",
                wardCode: undefined, // Reset child
                ward: "",
              });
              if (errors.provinceId) setErrors({ ...errors, provinceId: "" });
            }}
            disabled={provinces.length === 0}
          >
            <SelectTrigger
              className={errors.provinceId ? "border-red-500" : ""}
            >
              <SelectValue placeholder={t("addressForm.selectProvince")} />
            </SelectTrigger>
            <SelectContent>
              {provinces.map((p) => (
                <SelectItem key={p.ProvinceID} value={p.ProvinceID.toString()}>
                  {p.ProvinceName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <ErrorMessage message={errors.provinceId} />
        </div>

        {/* DISTRICT */}
        <div className="space-y-1">
          <Label>{t("addressForm.districtLabel")}</Label>
          <Select
            value={formData.districtId?.toString()}
            disabled={!formData.provinceId}
            onValueChange={(val) => {
              const dist = districts.find(
                (d) => d.DistrictID.toString() === val
              );
              setFormData({
                ...formData,
                districtId: Number(val),
                district: dist?.DistrictName || "",
                wardCode: undefined, // Reset child
                ward: "",
              });
              if (errors.districtId) setErrors({ ...errors, districtId: "" });
            }}
          >
            <SelectTrigger
              className={errors.districtId ? "border-red-500" : ""}
            >
              <SelectValue placeholder={t("addressForm.selectDistrict")} />
            </SelectTrigger>
            <SelectContent>
              {districts.map((d) => (
                <SelectItem key={d.DistrictID} value={d.DistrictID.toString()}>
                  {d.DistrictName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <ErrorMessage message={errors.districtId} />
        </div>

        {/* WARD */}
        <div className="space-y-1">
          <Label>{t("addressForm.wardLabel")}</Label>
          <Select
            value={formData.wardCode}
            disabled={!formData.districtId}
            onValueChange={(val) => {
              const w = wards.find((w) => w.WardCode === val);
              setFormData({
                ...formData,
                wardCode: val,
                ward: w?.WardName || "",
              });
              if (errors.wardCode) setErrors({ ...errors, wardCode: "" });
            }}
          >
            <SelectTrigger className={errors.wardCode ? "border-red-500" : ""}>
              <SelectValue placeholder={t("addressForm.selectWard")} />
            </SelectTrigger>
            <SelectContent>
              {wards.map((w) => (
                <SelectItem key={w.WardCode} value={w.WardCode}>
                  {w.WardName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <ErrorMessage message={errors.wardCode} />
        </div>
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
          disabled={
            isPending ||
            !formData.recipientName.trim() ||
            !formData.phoneNumber.trim() ||
            !formData.street.trim() ||
            !formData.provinceId ||
            !formData.districtId ||
            !formData.wardCode
          }
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
