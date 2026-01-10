/**
 * =====================================================================
 * EDIT CATEGORY DIALOG - Form chỉnh sửa danh mục
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. ĐỆ QUY & LOGIC PARENT:
 * - Khi sửa danh mục, phải tránh chọn Parent là chính nó (Circular Dependency).
 * - `availableParentCategories` lọc bỏ `category.id` hiện tại khỏi danh sách dropdown.
 *
 * 2. SLUG EDITING:
 * - Khác với lúc tạo (Auto-slug), khi sửa ta cho phép sửa Slug thủ công.
 * - Lý do: Đôi khi User muốn tối ưu lại URL cho chuẩn SEO mà không muốn đổi tên hiển thị.
 * =====================================================================
 */ 
"use client";

import { FormDialog } from "@/components/shared/form-dialog";
import { AnimatedError } from "@/components/shared/animated-error";
import { ImageUpload } from "@/components/shared/image-upload";
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
import { updateCategoryAction } from "@/features/admin/actions";
import { Category } from "@/types/models";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState, useTransition, useCallback } from "react";

// =============================================================================
// TYPES
// =============================================================================

interface EditCategoryDialogProps {
  /** All categories for parent selection */
  categories: Category[];
  /** Category being edited */
  category: Category;
  /** Dialog open state */
  open: boolean;
  /** Callback when dialog open state changes */
  onOpenChange: (open: boolean) => void;
}

interface FormState {
  name: string;
  slug: string;
  parentId: string;
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * Dialog for editing existing categories.
 *
 * Features:
 * - Self-parent prevention (category cannot be its own parent)
 * - Direct slug editing for SEO optimization
 * - Image replacement/removal
 * - Dirty checking to prevent unnecessary saves
 */
export function EditCategoryDialog({
  categories,
  category,
  open,
  onOpenChange,
}: EditCategoryDialogProps) {
  const t = useTranslations("admin");
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  // Form state
  const [formData, setFormData] = useState<FormState>({
    name: category.name,
    slug: category.slug,
    parentId: category.parentId || "none",
  });
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

  /** Categories available for parent selection (excludes self) */
  const availableParentCategories = useMemo(() => {
    return categories.filter((cat) => cat.id !== category.id);
  }, [categories, category.id]);

  /** Check if form has unsaved changes */
  const isDirty = useMemo(() => {
    return (
      formData.name !== category.name ||
      formData.slug !== category.slug ||
      formData.parentId !== (category.parentId || "none") ||
      image !== null ||
      isImageRemoved
    );
  }, [formData, category, image, isImageRemoved]);

  /** Current image to display */
  const currentImageUrl = useMemo(() => {
    if (imagePreview) return imagePreview;
    if (isImageRemoved) return undefined;
    return category.imageUrl || undefined;
  }, [imagePreview, isImageRemoved, category.imageUrl]);

  // =============================================================================
  // HANDLERS
  // =============================================================================

  const handleFieldChange = useCallback(
    (field: keyof FormState, value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: "" }));
      }
    },
    [errors]
  );

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

    if (!formData.name.trim()) {
      newErrors.name = t("categories.errorNameRequired");
    }
    if (!formData.slug.trim()) {
      newErrors.slug = t("categories.errorNameRequired");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, t]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!validate()) return;

      startTransition(async () => {
        const form = new FormData();
        form.append("name", formData.name.trim());
        form.append("slug", formData.slug.trim());

        if (formData.parentId !== "none") {
          form.append("parentId", formData.parentId);
        }

        if (image) {
          form.append("image", image);
        } else if (isImageRemoved) {
          form.append("deleteImage", "true");
        }

        const result = await updateCategoryAction(category.id, form as any);

        if (result.success) {
          toast({
            variant: "success",
            title: t("success"),
            description: t("categories.successUpdate"),
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
    [formData, image, isImageRemoved, category.id, validate, onOpenChange, t, toast]
  );

  // =============================================================================
  // RENDER
  // =============================================================================

  const isSubmitDisabled = !formData.name.trim() || !formData.slug.trim() || !isDirty;

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("categories.edit")}
      description={t("categories.editDescription")}
      onSubmit={handleSubmit}
      isPending={isPending}
      submitLabel={t("save")}
      maxWidth="sm:max-w-md"
      disabled={isSubmitDisabled}
    >
      <div className="space-y-4 py-4">
        {/* Name Field */}
        <div className="space-y-2">
          <Label htmlFor="edit-category-name">{t("categories.nameLabel")}</Label>
          <Input
            id="edit-category-name"
            value={formData.name}
            onChange={(e) => handleFieldChange("name", e.target.value)}
            disabled={isPending}
            className={errors.name ? "border-destructive" : ""}
            autoComplete="off"
          />
          <AnimatedError message={errors.name} />
        </div>

        {/* Slug Field */}
        <div className="space-y-2">
          <Label htmlFor="edit-category-slug">{t("categories.slugLabel")}</Label>
          <Input
            id="edit-category-slug"
            value={formData.slug}
            onChange={(e) => handleFieldChange("slug", e.target.value)}
            disabled={isPending}
            className={errors.slug ? "border-destructive" : ""}
            autoComplete="off"
          />
          <AnimatedError message={errors.slug} />
        </div>

        {/* Parent Category */}
        <div className="space-y-2">
          <Label htmlFor="edit-category-parent">{t("categories.parentLabel")}</Label>
          <Select
            value={formData.parentId}
            onValueChange={(value) => handleFieldChange("parentId", value)}
            disabled={isPending}
          >
            <SelectTrigger id="edit-category-parent">
              <SelectValue placeholder={t("categories.selectParent")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">{t("categories.noneRoot")}</SelectItem>
              {availableParentCategories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Image Upload */}
        <div className="space-y-2">
          <Label>{t("categories.imageLabel")}</Label>
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
