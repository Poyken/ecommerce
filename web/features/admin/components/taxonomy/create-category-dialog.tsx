/**
 * =====================================================================
 * CREATE CATEGORY DIALOG - Form tạo danh mục sản phẩm
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. AUTO-SLUG:
 * - Khi user nhập Tên danh mục (Name), hệ thống tự động generate Slug (đường dẫn).
 * - VD: Nhập "Điện thoại iPhone" -> Slug: "dien-thoai-iphone".
 * - Giúp SEO tốt hơn và user đỡ phải nhập tay.
 *
 * 2. PARENT SELECTION:
 * - Hỗ trợ cây danh mục đa cấp (Parent - Child).
 * - User có thể chọn danh mục cha hoặc "None" (nếu là danh mục gốc).
 *
 * 3. HÌNH ẢNH (`ImageUpload`):
 * - Component upload ảnh được tách riêng để tái sử dụng.
 * - Xử lý preview ảnh và upload file (multipart/form-data).
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
import { createCategoryAction } from "@/features/admin/actions";
import { Category } from "@/types/models";
import { FolderTree } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition, useCallback } from "react";

// =============================================================================
// TYPES
// =============================================================================

interface CreateCategoryDialogProps {
  /** Available parent categories for selection */
  categories: Category[];
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
// CONSTANTS
// =============================================================================

const INITIAL_FORM_STATE: FormState = {
  name: "",
  slug: "",
  parentId: "",
};

// =============================================================================
// UTILITIES
// =============================================================================

/**
 * Generate URL-friendly slug from text
 */
function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
    .replace(/[đĐ]/g, "d")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * Dialog for creating new product categories.
 * 
 * Features:
 * - Auto-generated slug from name
 * - Hierarchical parent selection
 * - Image upload support
 * - Form validation with animated errors
 */
export function CreateCategoryDialog({
  categories,
  open,
  onOpenChange,
}: CreateCategoryDialogProps) {
  const t = useTranslations("admin");
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  
  // Form state
  const [formData, setFormData] = useState<FormState>(INITIAL_FORM_STATE);
  const [image, setImage] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // =============================================================================
  // HANDLERS
  // =============================================================================

  const handleNameChange = useCallback((value: string) => {
    setFormData(prev => ({
      ...prev,
      name: value,
      slug: generateSlug(value),
    }));
    setErrors(prev => ({ ...prev, name: "", slug: "" }));
  }, []);

  const handleSlugChange = useCallback((value: string) => {
    setFormData(prev => ({ ...prev, slug: value }));
    setErrors(prev => ({ ...prev, slug: "" }));
  }, []);

  const handleParentChange = useCallback((value: string) => {
    setFormData(prev => ({ ...prev, parentId: value }));
  }, []);

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

  const resetForm = useCallback(() => {
    setFormData(INITIAL_FORM_STATE);
    setImage(null);
    setErrors({});
  }, []);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    startTransition(async () => {
      const form = new FormData();
      form.append("name", formData.name.trim());
      form.append("slug", formData.slug.trim());
      
      if (formData.parentId && formData.parentId !== "none") {
        form.append("parentId", formData.parentId);
      }
      if (image) {
        form.append("image", image);
      }

      const result = await createCategoryAction(form as any);
      
      if (result.success) {
        toast({
          variant: "success",
          title: t("success"),
          description: t("categories.successCreate"),
        });
        resetForm();
        onOpenChange(false);
      } else {
        toast({
          title: t("error"),
          description: result.error,
          variant: "destructive",
        });
      }
    });
  }, [formData, image, validate, resetForm, onOpenChange, t, toast]);

  // =============================================================================
  // RENDER
  // =============================================================================

  const isSubmitDisabled = !formData.name.trim() || !formData.slug.trim();

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("categories.createNew")}
      description={t("categories.description")}
      onSubmit={handleSubmit}
      isPending={isPending}
      submitLabel={t("create")}
      disabled={isSubmitDisabled}
      icon={<FolderTree className="h-5 w-5" />}
      variant="create"
    >
      <div className="space-y-4">
        {/* Name Field */}
        <div className="space-y-2">
          <Label htmlFor="category-name">{t("categories.nameLabel")}</Label>
          <Input
            id="category-name"
            placeholder={t("categories.placeholder")}
            value={formData.name}
            onChange={(e) => handleNameChange(e.target.value)}
            disabled={isPending}
            className={errors.name ? "border-destructive" : ""}
            autoComplete="off"
          />
          <AnimatedError message={errors.name} />
        </div>

        {/* Slug Field */}
        <div className="space-y-2">
          <Label htmlFor="category-slug">{t("categories.slugLabel")}</Label>
          <Input
            id="category-slug"
            placeholder={t("categories.slugPlaceholder")}
            value={formData.slug}
            onChange={(e) => handleSlugChange(e.target.value)}
            disabled={isPending}
            className={errors.slug ? "border-destructive" : ""}
            autoComplete="off"
          />
          <AnimatedError message={errors.slug} />
          <p className="text-sm text-muted-foreground">
            {t("categories.slugHint")}
          </p>
        </div>

        {/* Parent Category Field */}
        <div className="space-y-2">
          <Label htmlFor="category-parent">{t("categories.parentLabel")}</Label>
          <Select
            value={formData.parentId}
            onValueChange={handleParentChange}
            disabled={isPending}
          >
            <SelectTrigger id="category-parent">
              <SelectValue placeholder={t("categories.selectParent")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">{t("categories.noneRoot")}</SelectItem>
              {categories.map((cat) => (
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
            onChange={setImage}
            onRemove={() => setImage(null)}
            disabled={isPending}
          />
        </div>
      </div>
    </FormDialog>
  );
}
