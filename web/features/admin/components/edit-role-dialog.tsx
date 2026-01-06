"use client";

import { FormDialog } from "@/components/shared/form-dialog";
import { useToast } from "@/components/shared/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateRoleAction } from "@/features/admin/actions";
import { m } from "@/lib/animations";
import { AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import { useMemo, useState, useTransition } from "react";

/**
 * =====================================================================
 * EDIT ROLE DIALOG - Dialog chỉnh sửa vai trò
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. SIMPLE UPDATE:
 * - Cho phép đổi tên vai trò. Tương tự Permission, việc đổi tên vai trò cần được thực hiện cẩn thận.
 * =====================================================================
 */

interface EditRoleDialogProps {
  roleId: string;
  currentName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditRoleDialog({
  roleId,
  currentName,
  open,
  onOpenChange,
}: EditRoleDialogProps) {
  const t = useTranslations("admin");
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState(currentName);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Removed (Handled by key prop in parent)

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) {
      newErrors.name = t("roles.errorNameRequired");
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isDirty = useMemo(() => {
    return name.trim() !== currentName;
  }, [name, currentName]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    startTransition(async () => {
      const result = await updateRoleAction(roleId, name.trim());
      if (result.success) {
        toast({
          variant: "success",
          title: t("success"),
          description: t("roles.successUpdate"),
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
      title={t("roles.edit")}
      description={t("roles.description")}
      onSubmit={onSubmit}
      isPending={isPending}
      submitLabel={t("save")}
      maxWidth="sm:max-w-md"
      disabled={!isDirty || !name.trim()}
    >
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="name">{t("roles.nameLabel")}</Label>
          <Input
            id="name"
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
        </div>
      </div>
    </FormDialog>
  );
}
