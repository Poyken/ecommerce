/**
 * =====================================================================
 * CREATE USER DIALOG - Form tạo nhân viên mới
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. MỤC ĐÍCH:
 * - Dùng để admin tạo tài khoản cho nhân viên khác.
 * - KHÔNG PHẢI form đăng ký (Register) ngoại public website.
 *
 * 2. VALIDATION:
 * - Email: Phải đúng định dạng regex.
 * - Password: Tối thiểu 6 ký tự.
 * - Tên/Họ: Bắt buộc.
 *
 * 3. SECURITY:
 * - Password được gửi qua API (`createUserAction`) và sẽ được hash (mã hóa) ở Backend.
 * - Không bao giờ lưu plain-text password.
 * =====================================================================
 */ 
"use client";

import { createUserAction } from "@/features/admin/actions";
import { FormDialog } from "@/components/shared/form-dialog";
import { AnimatedError } from "@/components/shared/animated-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { UserPlus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition, useCallback } from "react";

// =============================================================================
// TYPES
// =============================================================================

interface CreateUserDialogProps {
  /** Dialog open state */
  open: boolean;
  /** Callback when dialog open state changes */
  onOpenChange: (open: boolean) => void;
}

interface FormState {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
}

// =============================================================================
// CONSTANTS
// =============================================================================

const INITIAL_FORM_STATE: FormState = {
  email: "",
  firstName: "",
  lastName: "",
  password: "",
};

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * Dialog for creating new user accounts.
 *
 * Features:
 * - User creation with email, name, and password
 * - Form validation with animated errors
 * - Loading state during submission
 */
export function CreateUserDialog({
  open,
  onOpenChange,
}: CreateUserDialogProps) {
  const t = useTranslations("admin");
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  
  // Form state
  const [formData, setFormData] = useState<FormState>(INITIAL_FORM_STATE);
  const [errors, setErrors] = useState<Record<string, string>>({});

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

  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.email.trim()) {
      newErrors.email = t("users.errorRequired");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t("users.errorInvalidEmail");
    }

    if (!formData.firstName.trim()) {
      newErrors.firstName = t("users.errorRequired");
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = t("users.errorRequired");
    }

    if (!formData.password.trim()) {
      newErrors.password = t("users.errorRequired");
    } else if (formData.password.length < 6) {
      newErrors.password = t("users.errorPasswordTooShort");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, t]);

  const resetForm = useCallback(() => {
    setFormData(INITIAL_FORM_STATE);
    setErrors({});
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!validate()) return;

      startTransition(async () => {
        const result = await createUserAction(formData as any);

        if (result.success) {
          toast({
            variant: "success",
            title: t("success"),
            description: t("users.successCreate"),
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
    [formData, validate, resetForm, onOpenChange, t, toast]
  );

  // =============================================================================
  // RENDER
  // =============================================================================

  const isSubmitDisabled =
    !formData.email.trim() ||
    !formData.firstName.trim() ||
    !formData.lastName.trim() ||
    !formData.password.trim();

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("users.createNew")}
      description={t("users.title")}
      onSubmit={handleSubmit}
      isPending={isPending}
      submitLabel={t("users.createNew")}
      disabled={isSubmitDisabled}
      icon={<UserPlus className="h-5 w-5" />}
      variant="create"
    >
      <div className="space-y-4 py-4">
        {/* Email Field */}
        <div className="space-y-2">
          <Label htmlFor="user-email">{t("users.emailLabel")}</Label>
          <Input
            id="user-email"
            type="email"
            placeholder={t("users.emailPlaceholder")}
            value={formData.email}
            onChange={(e) => handleFieldChange("email", e.target.value)}
            disabled={isPending}
            className={errors.email ? "border-destructive" : ""}
            autoComplete="email"
          />
          <AnimatedError message={errors.email} />
        </div>

        {/* Name Fields */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="user-firstName">{t("users.firstNameLabel")}</Label>
            <Input
              id="user-firstName"
              placeholder={t("users.firstNamePlaceholder")}
              value={formData.firstName}
              onChange={(e) => handleFieldChange("firstName", e.target.value)}
              disabled={isPending}
              className={errors.firstName ? "border-destructive" : ""}
              autoComplete="given-name"
            />
            <AnimatedError message={errors.firstName} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="user-lastName">{t("users.lastNameLabel")}</Label>
            <Input
              id="user-lastName"
              placeholder={t("users.lastNamePlaceholder")}
              value={formData.lastName}
              onChange={(e) => handleFieldChange("lastName", e.target.value)}
              disabled={isPending}
              className={errors.lastName ? "border-destructive" : ""}
              autoComplete="family-name"
            />
            <AnimatedError message={errors.lastName} />
          </div>
        </div>

        {/* Password Field */}
        <div className="space-y-2">
          <Label htmlFor="user-password">{t("users.passwordLabel")}</Label>
          <Input
            id="user-password"
            type="password"
            placeholder="••••••••"
            value={formData.password}
            onChange={(e) => handleFieldChange("password", e.target.value)}
            disabled={isPending}
            className={errors.password ? "border-destructive" : ""}
            autoComplete="new-password"
          />
          <AnimatedError message={errors.password} />
        </div>
      </div>
    </FormDialog>
  );
}
