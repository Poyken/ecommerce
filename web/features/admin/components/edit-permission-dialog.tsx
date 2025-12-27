"use client";

import { FormDialog } from "@/components/shared/form-dialog";
import { useToast } from "@/components/shared/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updatePermissionAction } from "@/features/admin/actions";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { useMemo, useState, useTransition } from "react";

/**
 * =====================================================================
 * EDIT PERMISSION DIALOG - Dialog chỉnh sửa quyền hạn
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. PERSISTENCE:
 * - Cập nhật tên quyền hạn hiện có. Lưu ý: Việc đổi tên quyền hạn có thể ảnh hưởng đến logic check quyền ở code, nên cần cẩn trọng.
 * =====================================================================
 */

interface EditPermissionDialogProps {
  permissionId: string;
  currentName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditPermissionDialog({
  permissionId,
  currentName,
  open,
  onOpenChange,
}: EditPermissionDialogProps) {
  const t = useTranslations("admin");
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState(currentName);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // REMOVED (Handled by key prop in parent)

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) {
      newErrors.name = t("permissions.errorNameRequired");
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
      const result = await updatePermissionAction(permissionId, name.trim());
      if (result.success) {
        toast({
          variant: "success",
          title: t("success"),
          description: t("permissions.successUpdate"),
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
      title={t("permissions.edit")}
      description={t("permissions.description")}
      onSubmit={onSubmit}
      isPending={isPending}
      submitLabel={t("save")}
      maxWidth="sm:max-w-md"
    >
      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="name">{t("permissions.nameLabel")}</Label>
          <Input
            id="name"
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
