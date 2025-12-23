"use client";

import { createRoleAction } from "@/actions/admin";
import { FormDialog } from "@/components/atoms/form-dialog";
import { Input } from "@/components/atoms/input";
import { Label } from "@/components/atoms/label";
import { useToast } from "@/hooks/use-toast";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";

/**
 * =====================================================================
 * CREATE ROLE DIALOG - Dialog tạo vai trò mới (Admin, Staff, etc.)
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. ROLE NAMING:
 * - Tên vai trò thường được viết hoa toàn bộ (VD: `MANAGER`).
 * - Hệ thống tự động gọi `toUpperCase()` khi Admin nhập liệu.
 *
 * 2. SERVER ACTION:
 * - `createRoleAction` xử lý việc lưu vai trò mới vào database.
 * =====================================================================
 */

interface CreateRoleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateRoleDialog({
  open,
  onOpenChange,
}: CreateRoleDialogProps) {
  const t = useTranslations("admin");
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) {
      newErrors.name = t("roles.errorNameRequired");
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    const submitName = name.trim();

    startTransition(async () => {
      const result = await createRoleAction(submitName);
      if (result.success) {
        toast({
          variant: "success",
          title: t("success"),
          description: t("roles.successCreate"),
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
      title={t("roles.createNew")}
      description={t("roles.title")}
      onSubmit={handleSubmit}
      isPending={isPending}
      submitLabel={t("create")}
    >
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="name">{t("roles.nameLabel")}</Label>
          <Input
            id="name"
            placeholder={t("roles.namePlaceholder")}
            value={name}
            onChange={(e) => {
              setName(e.target.value.toUpperCase());
              if (errors.name) setErrors({ ...errors, name: "" });
            }}
            disabled={isPending}
            className={errors.name ? "border-destructive" : ""}
          />
          <AnimatePresence>
            {errors.name && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="text-xs text-destructive"
              >
                {errors.name}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>
    </FormDialog>
  );
}
