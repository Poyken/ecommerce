"use client";

import { assignRolesAction, getRolesAction } from "@/features/admin/actions";
import { Checkbox } from "@/components/ui/checkbox";
import { FormDialog } from "@/components/shared/form-dialog";
import { useToast } from "@/components/shared/use-toast";
import { Role } from "@/types/models";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState, useTransition } from "react";

/**
 * =====================================================================
 * ASSIGN ROLES DIALOG - Gán vai trò cho người dùng
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. RBAC (Role-Based Access Control):
 * - Thay vì gán từng quyền lẻ tẻ, ta gán "Vai trò" (Admin, Manager, Customer) cho người dùng.
 * - Một người dùng có thể có nhiều vai trò cùng lúc.
 *
 * 2. DYNAMIC FETCHING:
 * - Khi mở Dialog, hệ thống load danh sách tất cả các Role hiện có từ database.
 *
 * 3. CHECKBOX LOGIC:
 * - `toggleRole`: Thêm hoặc xóa tên vai trò khỏi danh sách `selectedRoleNames` khi click vào checkbox.
 * - `currentRoles`: Dùng để check mặc định các vai trò mà user đang có.
 * =====================================================================
 */

interface AssignRolesDialogProps {
  userId: string;
  userName: string;
  currentRoles: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AssignRolesDialog({
  userId,
  userName,
  currentRoles,
  open,
  onOpenChange,
}: AssignRolesDialogProps) {
  const t = useTranslations("admin");
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRoleNames, setSelectedRoleNames] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      getRolesAction().then((response) => {
        if (response.success && response.data) {
          const rolesData = response.data;
          setRoles(rolesData);
          // Chuyển đổi ID vai trò hiện tại thành tên
          const currentRoleNames = rolesData
            .filter((role: Role) => currentRoles.includes(role.id))
            .map((role: Role) => role.name);
          setSelectedRoleNames(currentRoleNames);
        }
      });
    }
  }, [open, currentRoles]);

  const isDirty = useMemo(() => {
    // We compare names because that's what we store in selectedRoleNames
    const originalRoleNames = roles
      .filter((role: Role) => currentRoles.includes(role.id))
      .map((role: Role) => role.name)
      .sort();

    const currentRoleNames = [...selectedRoleNames].sort();

    return (
      JSON.stringify(originalRoleNames) !== JSON.stringify(currentRoleNames)
    );
  }, [selectedRoleNames, roles, currentRoles]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      const result = await assignRolesAction(userId, selectedRoleNames);
      if (result.success) {
        toast({
          variant: "success",
          title: t("success"),
          description: t("users.successAssignRoles"),
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

  const toggleRole = (roleName: string) => {
    setSelectedRoleNames((prev) =>
      prev.includes(roleName)
        ? prev.filter((name) => name !== roleName)
        : [...prev, roleName]
    );
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("users.assignRoles")}
      description={t("users.selectRolesFor", { name: userName })}
      onSubmit={handleSubmit}
      isPending={isPending}
      submitLabel={t("save")}
      disabled={isPending || !isDirty}
    >
      <div className="space-y-4 py-4">
        {roles.map((role) => (
          <div key={role.id} className="flex items-center space-x-2">
            <Checkbox
              id={role.id}
              checked={selectedRoleNames.includes(role.name)}
              onCheckedChange={() => toggleRole(role.name)}
              disabled={isPending}
            />
            <label
              htmlFor={role.id}
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              {role.name}
            </label>
          </div>
        ))}
      </div>
    </FormDialog>
  );
}
