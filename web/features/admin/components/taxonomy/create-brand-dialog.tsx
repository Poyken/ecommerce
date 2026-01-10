/**
 * =====================================================================
 * CREATE BRAND DIALOG - Form tạo Thương hiệu mới
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. USE TRANSITION:
 * - Sử dụng `useTransition` để đánh dấu trạng thái "Pending" khi đang gọi Server Action.
 * - Giúp UI không bị đơ (non-blocking) và có thể hiển thị loading spinner.
 *
 * 2. UNCONTROLLED vs CONTROLLED:
 * - Form này dùng Controlled Inputs (state `name`, `image`) để dễ dàng validate
 *   ngay khi user gõ phím.
 * =====================================================================
 */ 
"use client";

import { FormDialog } from "@/components/shared/form-dialog";
import { AnimatedError } from "@/components/shared/animated-error";
import { ImageUpload } from "@/components/shared/image-upload";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { createBrandAction } from "@/features/admin/actions";
import { Award } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition, useCallback } from "react";

// =============================================================================
// TYPES
// =============================================================================

interface CreateBrandDialogProps {
  /** Dialog open state */
  open: boolean;
  /** Callback when dialog open state changes */
  onOpenChange: (open: boolean) => void;
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * Dialog for creating new product brands.
 *
 * Features:
 * - Brand name input with validation
 * - Logo image upload
 * - Animated validation errors
 */
export function CreateBrandDialog({
  open,
  onOpenChange,
}: CreateBrandDialogProps) {
  const t = useTranslations("admin");
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  // Form state
  const [name, setName] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // =============================================================================
  // HANDLERS
  // =============================================================================

  const handleNameChange = useCallback((value: string) => {
    setName(value);
    if (errors.name) {
      setErrors((prev) => ({ ...prev, name: "" }));
    }
  }, [errors.name]);

  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = t("brands.errorNameRequired");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [name, t]);

  const resetForm = useCallback(() => {
    setName("");
    setImage(null);
    setErrors({});
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!validate()) return;

      startTransition(async () => {
        const formData = new FormData();
        formData.append("name", name.trim());
        if (image) formData.append("image", image);

        const result = await createBrandAction(formData);

        if (result.success) {
          toast({
            variant: "success",
            title: t("success"),
            description: t("brands.successCreate"),
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
    },
    [name, image, validate, resetForm, onOpenChange, t, toast]
  );

  // =============================================================================
  // RENDER
  // =============================================================================

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("brands.createNew")}
      description={t("brands.description")}
      onSubmit={handleSubmit}
      isPending={isPending}
      submitLabel={t("create")}
      disabled={!name.trim()}
      icon={<Award className="h-5 w-5" />}
      variant="create"
    >
      <div className="space-y-4">
        {/* Name Field */}
        <div className="space-y-2">
          <Label htmlFor="brand-name">{t("brands.nameLabel")}</Label>
          <Input
            id="brand-name"
            placeholder={t("brands.placeholder")}
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
            onChange={setImage}
            onRemove={() => setImage(null)}
            disabled={isPending}
          />
        </div>
      </div>
    </FormDialog>
  );
}
