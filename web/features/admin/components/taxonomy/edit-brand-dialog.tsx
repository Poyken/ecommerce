/**
 * =====================================================================
 * EDIT BRAND DIALOG - Form chỉnh sửa thương hiệu
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. QUẢN LÝ ẢNH (Image Logic):
 * - Trạng thái ảnh phức tạp hơn text bình thường:
 *   + Giữ nguyên (không làm gì).
 *   + Thay ảnh mới (`image` Object).
 *   + Xóa ảnh cũ (`isImageRemoved = true`).
 * - Cần `URL.revokeObjectURL(imagePreview)` trong `useEffect` để tránh Memory Leak
 *   khi tạo preview URL từ file upload.
 *
 * 2. COMPUTED VALUES (`useMemo`):
 * - `currentImageUrl`: Tính toán URL nào sẽ hiển thị (preview mới hay URL cũ). *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Component giao diện (UI) tái sử dụng, đảm bảo tính nhất quán về thiết kế (Design System).

 * =====================================================================
 */ 
"use client";

import { FormDialog } from "@/components/shared/form-dialog";
import { AnimatedError } from "@/components/shared/animated-error";
import { ImageUpload } from "@/components/shared/image-upload";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { updateBrandAction } from "@/features/admin/actions";
import { Brand } from "@/types/models";
import { useTranslations } from "next-intl";
import { useState, useTransition, useCallback, useMemo, useEffect } from "react";

// =============================================================================
// TYPES
// =============================================================================

interface EditBrandDialogProps {
  /** Brand data to edit */
  brand: Brand;
  /** Dialog open state */
  open: boolean;
  /** Callback when dialog open state changes */
  onOpenChange: (open: boolean) => void;
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * Dialog for editing existing brands.
 *
 * Features:
 * - Pre-populated form with brand data
 * - Logo image replacement/removal
 * - Dirty checking to prevent unnecessary saves
 * - Animated validation errors
 */
export function EditBrandDialog({
  brand,
  open,
  onOpenChange,
}: EditBrandDialogProps) {
  const t = useTranslations("admin");
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  // Form state
  const [name, setName] = useState(brand.name);
  const [image, setImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isImageRemoved, setIsImageRemoved] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Cleanup image preview URL on unmount
  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  // =============================================================================
  // COMPUTED VALUES
  // =============================================================================

  const isDirty = useMemo(() => {
    return name !== brand.name || image !== null || isImageRemoved;
  }, [name, brand.name, image, isImageRemoved]);

  const currentImageUrl = useMemo(() => {
    if (imagePreview) return imagePreview;
    if (isImageRemoved) return undefined;
    return brand.imageUrl || undefined;
  }, [imagePreview, isImageRemoved, brand.imageUrl]);

  // =============================================================================
  // HANDLERS
  // =============================================================================

  const handleNameChange = useCallback((value: string) => {
    setName(value);
    if (errors.name) {
      setErrors((prev) => ({ ...prev, name: "" }));
    }
  }, [errors.name]);

  const handleImageChange = useCallback((file: File | null) => {
    if (file) {
      setImage(file);
      const url = URL.createObjectURL(file);
      setImagePreview(url);
      setIsImageRemoved(false);
    }
  }, []);

  const handleImageRemove = useCallback(() => {
    setImage(null);
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    setIsImageRemoved(true);
  }, [imagePreview]);

  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = t("brands.errorNameRequired");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [name, t]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!validate()) return;

      startTransition(async () => {
        const formData = new FormData();
        formData.append("name", name.trim());

        if (image) {
          formData.append("image", image);
        } else if (isImageRemoved) {
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
        } else {
          toast({
            title: t("error"),
            description: result.error,
            variant: "destructive",
          });
        }
      });
    },
    [name, image, isImageRemoved, brand.id, validate, onOpenChange, t, toast]
  );

  // =============================================================================
  // RENDER
  // =============================================================================

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("brands.edit")}
      description={t("brands.editDescription")}
      onSubmit={handleSubmit}
      isPending={isPending}
      submitLabel={t("save")}
      maxWidth="sm:max-w-md"
      disabled={!name.trim() || !isDirty}
    >
      <div className="space-y-4 py-4">
        {/* Name Field */}
        <div className="space-y-2">
          <Label htmlFor="edit-brand-name">{t("brands.nameLabel")}</Label>
          <Input
            id="edit-brand-name"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            disabled={isPending}
            className={errors.name ? "border-destructive" : ""}
            autoComplete="off"
          />
          <AnimatedError message={errors.name} />
        </div>

        {/* Logo Upload */}
        <div className="space-y-2">
          <Label>{t("brands.logoLabel")}</Label>
          <ImageUpload
            value={currentImageUrl}
            onChange={handleImageChange}
            onRemove={handleImageRemove}
            disabled={isPending}
          />
        </div>
      </div>
    </FormDialog>
  );
}
