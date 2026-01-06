"use client";

import { FormDialog } from "@/components/shared/form-dialog";
import { useToast } from "@/components/shared/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createPermissionAction } from "@/features/admin/actions";
import { m } from "@/lib/animations";
import { AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

/**
 * =====================================================================
 * CREATE PERMISSION DIALOG - Dialog tạo quyền hạn mới
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. NAMING CONVENTION:
 * - Quyền hạn nên được đặt theo format `resource:action` (VD: `product:create`).
 * - Hệ thống tự động chuyển text sang `lowercase` để đảm bảo tính nhất quán.
 *
 * 2. FEEDBACK:
 * - Sử dụng `AnimatePresence` để hiển thị lỗi validation một cách mượt mà.
 * =====================================================================
 */

interface CreatePermissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreatePermissionDialog({
  open,
  onOpenChange,
}: CreatePermissionDialogProps) {
  const t = useTranslations("admin");
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) {
      newErrors.name = t("permissions.errorNameRequired");
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    const submitName = name.trim();

    startTransition(async () => {
      const result = await createPermissionAction(submitName);
      if (result.success) {
        toast({
          variant: "success",
          title: t("success"),
          description: t("permissions.successCreate"),
        });
        setName("");
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
      title={t("permissions.createNew")}
      description={t("permissions.description")}
      onSubmit={handleSubmit}
      isPending={isPending}
      submitLabel={t("create")}
      disabled={!name.trim()}
    >
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="name">{t("permissions.nameLabel")}</Label>
          <Input
            id="name"
            placeholder={t("permissions.namePlaceholder")}
            value={name}
            onChange={(e) => {
              setName(e.target.value.toLowerCase());
              if (errors.name) setErrors({ ...errors, name: "" });
            }}
            disabled={isPending}
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
          <p className="text-xs text-gray-500">{t("permissions.nameHint")}</p>
        </div>
      </div>
    </FormDialog>
  );
}
