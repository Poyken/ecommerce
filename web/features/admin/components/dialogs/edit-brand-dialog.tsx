"use client";

import { FormDialog } from "@/components/shared/form-dialog";
import { ImageUpload } from "@/components/shared/image-upload";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateBrandAction } from "@/features/admin/actions";
import { m } from "@/lib/animations";
import { AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState, useTransition } from "react";

import { Brand } from "@/types/models";
// ... (rest of imports handled by diff context if needed, but I should be careful)

/**
 * =====================================================================
 * EDIT BRAND DIALOG - Dialog chỉnh sửa thương hiệu
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. STATE INITIALIZATION:
 * - Sử dụng `useEffect` để đồng bộ dữ liệu từ prop `brand` vào state cục bộ khi dialog mở ra.
 *
 * 2. DIRTY CHECKING:
 * - `isDirty` (useMemo) kiểm tra xem người dùng đã thay đổi bất kỳ thông tin nào chưa.
 * - Nếu chưa thay đổi, nút "Lưu" sẽ bị vô hiệu hóa để tránh gọi API thừa.
 *
 * 3. IMAGE MANAGEMENT:
 * - Xử lý 3 trường hợp: Giữ nguyên ảnh cũ, Thay ảnh mới, hoặc Xóa hẳn ảnh logo.
 * =====================================================================
 */

interface EditBrandDialogProps {
  brand: Brand;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditBrandDialog({
  brand,
  open,
  onOpenChange,
}: EditBrandDialogProps) {
  const t = useTranslations("admin");
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState(brand.name);
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isImageRemoved, setIsImageRemoved] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // No useEffect needed here for prop syncing as the parent uses a 'key' prop to reset this component when the brand changes.
  // This avoids react-hooks/set-state-in-effect linting errors.

  // Cleanup image preview URL when unmount or image changes
  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) {
      newErrors.name = t("brands.errorNameRequired");
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isDirty = useMemo(() => {
    return name !== brand.name || image !== null || isImageRemoved;
  }, [name, brand.name, image, isImageRemoved]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    setIsLoading(true);
    startTransition(async () => {
      const formData = new FormData();
      formData.append("name", name);

      if (image) {
        // Upload new image
        formData.append("image", image);
      } else if (isImageRemoved) {
        // Remove existing image
        formData.append("deleteImage", "true");
      }

      const result = await updateBrandAction(brand.id, formData);
      if (result.success) {
        toast({
          variant: "success",
          title: t("success"),
          description: t("brands.successUpdate"),
        });
        onOpenChange(false);
        // Do NOT set isLoading(false) here to avoid flicker during closing
      } else {
        toast({
          title: t("error"),
          description: result.error,
          variant: "destructive",
        });
        setIsLoading(false);
      }
    });
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("brands.edit")}
      description={t("brands.editDescription")}
      onSubmit={onSubmit}
      isPending={isLoading}
      submitLabel={t("save")}
      maxWidth="sm:max-w-md"
      disabled={!name.trim() || !isDirty}
    >
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="name">{t("brands.nameLabel")}</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (errors.name) setErrors((prev) => ({ ...prev, name: "" }));
            }}
            disabled={isLoading}
            className={errors.name ? "border-destructive" : ""}
          />
          <AnimatePresence>
            {errors.name && (
              <m.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="text-xs text-destructive"
              >
                {errors.name}
              </m.p>
            )}
          </AnimatePresence>
        </div>
        <div className="space-y-2">
          <Label>{t("brands.logoLabel")}</Label>
          <ImageUpload
            value={
              imagePreview ||
              (isImageRemoved ? undefined : brand.imageUrl) ||
              undefined
            }
            onChange={(file) => {
              if (file) {
                setImage(file);
                const url = URL.createObjectURL(file);
                setImagePreview(url);
                setIsImageRemoved(false); // A new image is selected, so it's not "removed"
              } else {
                // This branch might not be hit by ImageUpload onChange if file is null?
                // No, onChange(null) happens? ImageUpload calls onChange(file) only on drop.
                // It calls onRemove separately.
              }
            }}
            onRemove={() => {
              setImage(null);
              if (imagePreview) URL.revokeObjectURL(imagePreview);
              setImagePreview(null);
              setIsImageRemoved(true);
            }}
            disabled={isLoading}
          />
        </div>
      </div>
    </FormDialog>
  );
}
