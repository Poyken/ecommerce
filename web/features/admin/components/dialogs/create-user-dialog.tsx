"use client";

import { createUserAction } from "@/features/admin/actions";
import { FormDialog } from "@/components/shared/form-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { m } from "@/lib/animations";
import { AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

/**
 * =====================================================================
 * CREATE USER DIALOG - Dialog tạo tài khoản người dùng mới
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. USER FIELDS:
 * - Thu thập các thông tin cơ bản: Email, Họ, Tên và Mật khẩu khởi tạo.
 *
 * 2. VALIDATION:
 * - Đảm bảo tất cả các trường đều được điền đầy đủ trước khi tạo tài khoản.
 * =====================================================================
 */

interface CreateUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateUserDialog({
  open,
  onOpenChange,
}: CreateUserDialogProps) {
  const t = useTranslations("admin");
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    password: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.email.trim()) newErrors.email = t("users.errorRequired");
    if (!formData.firstName.trim())
      newErrors.firstName = t("users.errorRequired");
    if (!formData.lastName.trim())
      newErrors.lastName = t("users.errorRequired");
    if (!formData.password.trim())
      newErrors.password = t("users.errorRequired");

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
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
        // Reset form
        setFormData({
          email: "",
          firstName: "",
          lastName: "",
          password: "",
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
      title={t("users.createNew")}
      description={t("users.title")}
      onSubmit={handleSubmit}
      isPending={isPending}
      submitLabel={t("users.createNew")}
      disabled={
        !formData.email.trim() ||
        !formData.firstName.trim() ||
        !formData.lastName.trim() ||
        !formData.password.trim()
      }
    >
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="email">{t("users.emailLabel")}</Label>
          <Input
            id="email"
            type="email"
            placeholder={t("users.emailPlaceholder")}
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
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">{t("users.firstNameLabel")}</Label>
            <Input
              id="firstName"
              placeholder={t("users.firstNamePlaceholder")}
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
              placeholder={t("users.lastNamePlaceholder")}
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
          <Label htmlFor="password">{t("users.passwordLabel")}</Label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={formData.password}
            onChange={(e) => {
              setFormData({ ...formData, password: e.target.value });
              if (errors.password) setErrors({ ...errors, password: "" });
            }}
            disabled={isPending}
            className={errors.password ? "border-destructive" : ""}
          />
          <AnimatePresence>
            {errors.password && (
              <m.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="text-xs text-destructive"
              >
                {errors.password}
              </m.p>
            )}
          </AnimatePresence>
        </div>
      </div>
    </FormDialog>
  );
}
