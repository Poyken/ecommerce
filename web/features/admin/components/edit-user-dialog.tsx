"use client";

import { FormDialog } from "@/components/shared/form-dialog";
import { useToast } from "@/components/shared/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateUserAction } from "@/features/admin/domain-actions/user-actions";
import { User } from "@/types/models";
import { m } from "@/lib/animations";
import { AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { useMemo, useState, useTransition } from "react";

/**
 * =====================================================================
 * EDIT USER DIALOG - Dialog chỉnh sửa thông tin người dùng
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. PROFILE UPDATE:
 * - Cho phép Admin cập nhật Họ tên và Email của người dùng.
 * - Lưu ý: Việc đổi Email có thể ảnh hưởng đến đăng nhập nếu hệ thống dùng Email làm username.
 * =====================================================================
 */

interface EditUserDialogProps {
  user: User;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditUserDialog({
  user,
  open,
  onOpenChange,
}: EditUserDialogProps) {
  const t = useTranslations("admin");
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [formData, setFormData] = useState({
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset form when user prop changes - Removed (Handled by key prop in parent)

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.email.trim()) newErrors.email = t("users.errorRequired");
    if (!formData.firstName.trim())
      newErrors.firstName = t("users.errorRequired");
    if (!formData.lastName.trim())
      newErrors.lastName = t("users.errorRequired");

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isDirty = useMemo(() => {
    return (
      formData.firstName !== user.firstName ||
      formData.lastName !== user.lastName ||
      formData.email !== user.email
    );
  }, [formData, user]);

  const onSubmit = (e: React.FormEvent) => {
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
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("users.edit")}
      onSubmit={onSubmit}
      isPending={isPending}
      submitLabel={t("save")}
      disabled={
        !isDirty ||
        !formData.email.trim() ||
        !formData.firstName.trim() ||
        !formData.lastName.trim()
      }
    >
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">{t("users.firstNameLabel")}</Label>
          <Input
            id="firstName"
            value={formData.firstName}
            onChange={(e) => {
              setFormData({ ...formData, firstName: e.target.value });
              if (errors.firstName) setErrors({ ...errors, firstName: "" });
            }}
            disabled={isPending}
            className={errors.firstName ? "border-destructive" : ""}
          />
          <AnimatePresence>
            {errors.firstName && (
              <m.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="text-xs text-destructive"
              >
                {errors.firstName}
              </m.p>
            )}
          </AnimatePresence>
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">{t("users.lastNameLabel")}</Label>
          <Input
            id="lastName"
            value={formData.lastName}
            onChange={(e) => {
              setFormData({ ...formData, lastName: e.target.value });
              if (errors.lastName) setErrors({ ...errors, lastName: "" });
            }}
            disabled={isPending}
            className={errors.lastName ? "border-destructive" : ""}
          />
          <AnimatePresence>
            {errors.lastName && (
              <m.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="text-xs text-destructive"
              >
                {errors.lastName}
              </m.p>
            )}
          </AnimatePresence>
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">{t("users.emailLabel")}</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => {
            setFormData({ ...formData, email: e.target.value });
            if (errors.email) setErrors({ ...errors, email: "" });
          }}
          disabled={isPending}
          className={errors.email ? "border-destructive" : ""}
        />
        <AnimatePresence>
          {errors.email && (
            <m.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="text-xs text-destructive"
            >
              {errors.email}
            </m.p>
          )}
        </AnimatePresence>
      </div>
    </FormDialog>
  );
}
