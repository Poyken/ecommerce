 
"use client";

import { FormDialog } from "@/components/shared/form-dialog";
import { AnimatedError } from "@/components/shared/animated-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { updateUserAction } from "@/features/admin/domain-actions/user-actions";
import { User } from "@/types/models";
import { useTranslations } from "next-intl";
import { useMemo, useState, useTransition, useCallback } from "react";

// =============================================================================
// TYPES
// =============================================================================

interface EditUserDialogProps {
  /** User data to edit */
  user: User;
  /** Dialog open state */
  open: boolean;
  /** Callback when dialog open state changes */
  onOpenChange: (open: boolean) => void;
}

interface FormState {
  firstName: string;
  lastName: string;
  email: string;
}

// =============================================================================
// COMPONENT
// =============================================================================

/**
 * Dialog for editing existing user accounts.
 *
 * Features:
 * - Update user's name and email
 * - Dirty checking to prevent unnecessary saves
 * - Form validation with animated errors
 *
 * Note: Email changes may affect login if email is used as username.
 */
export function EditUserDialog({
  user,
  open,
  onOpenChange,
}: EditUserDialogProps) {
  const t = useTranslations("admin");
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  // Form state
  const [formData, setFormData] = useState<FormState>({
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // =============================================================================
  // COMPUTED VALUES
  // =============================================================================

  /** Check if form has unsaved changes */
  const isDirty = useMemo(() => {
    return (
      formData.firstName !== user.firstName ||
      formData.lastName !== user.lastName ||
      formData.email !== user.email
    );
  }, [formData, user]);

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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, t]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!validate()) return;

      startTransition(async () => {
        const result = await updateUserAction(user.id, formData as any);

        if (result.success) {
          toast({
            variant: "success",
            title: t("success"),
            description: t("users.successUpdate"),
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
    [formData, user.id, validate, onOpenChange, t, toast]
  );

  // =============================================================================
  // RENDER
  // =============================================================================

  const isSubmitDisabled =
    !isDirty ||
    !formData.email.trim() ||
    !formData.firstName.trim() ||
    !formData.lastName.trim();

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("users.edit")}
      onSubmit={handleSubmit}
      isPending={isPending}
      submitLabel={t("save")}
      disabled={isSubmitDisabled}
    >
      <div className="space-y-4 py-4">
        {/* Name Fields */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="edit-user-firstName">{t("users.firstNameLabel")}</Label>
            <Input
              id="edit-user-firstName"
              value={formData.firstName}
              onChange={(e) => handleFieldChange("firstName", e.target.value)}
              disabled={isPending}
              className={errors.firstName ? "border-destructive" : ""}
              autoComplete="given-name"
            />
            <AnimatedError message={errors.firstName} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-user-lastName">{t("users.lastNameLabel")}</Label>
            <Input
              id="edit-user-lastName"
              value={formData.lastName}
              onChange={(e) => handleFieldChange("lastName", e.target.value)}
              disabled={isPending}
              className={errors.lastName ? "border-destructive" : ""}
              autoComplete="family-name"
            />
            <AnimatedError message={errors.lastName} />
          </div>
        </div>

        {/* Email Field */}
        <div className="space-y-2">
          <Label htmlFor="edit-user-email">{t("users.emailLabel")}</Label>
          <Input
            id="edit-user-email"
            type="email"
            value={formData.email}
            onChange={(e) => handleFieldChange("email", e.target.value)}
            disabled={isPending}
            className={errors.email ? "border-destructive" : ""}
            autoComplete="email"
          />
          <AnimatedError message={errors.email} />
        </div>
      </div>
    </FormDialog>
  );
}
