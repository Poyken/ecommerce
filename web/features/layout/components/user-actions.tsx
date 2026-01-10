"use client";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deleteUserAction } from "@/features/admin/actions";
import { AssignRolesDialog } from "@/features/admin/components/users/assign-roles-dialog";
import { DeleteConfirmDialog } from "@/features/admin/components/shared/delete-confirm-dialog";
import { EditUserDialog } from "@/features/admin/components/users/edit-user-dialog";
import { useAuth } from "@/features/auth/providers/auth-provider";
import { MoreHorizontal } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

import { User } from "@/types/models";

/**
 * =====================================================================
 * USER ACTIONS - Các thao tác quản lý User (Admin)
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. DROPDOWN MENU:
 * - Sử dụng `DropdownMenu` để ẩn các thao tác ít dùng (Edit, Assign Roles, Delete) vào một nút "Ba chấm".
 * - Giúp bảng danh sách user trông gọn gàng hơn.
 *
 * 2. DIALOG MANAGEMENT:
 * - Mỗi thao tác (Edit, Delete, Roles) được quản lý bởi một `useState` riêng để mở/đóng Dialog tương ứng.
 * - Cách tiếp cận này giúp tách biệt logic xử lý của từng tính năng.
 *
 * 3. ACCESSIBILITY:
 * - Sử dụng `sr-only` cho text "Open menu" để hỗ trợ các thiết bị đọc màn hình (Screen Readers).
 * =====================================================================
 */

interface UserActionsProps {
  user: User;
}

export function UserActions({ user }: UserActionsProps) {
  const { hasPermission } = useAuth();
  const [assignRolesOpen, setAssignRolesOpen] = useState(false);
  const [editUserOpen, setEditUserOpen] = useState(false);
  const [deleteUserOpen, setDeleteUserOpen] = useState(false);
  const t = useTranslations("admin.users.actions");

  const canUpdate = hasPermission("user:update");
  const canDelete = hasPermission("user:delete");
  const canAssignRoles = hasPermission("user:update");

  const currentRoleIds = user.roles?.map((ur) => ur.role?.id) || [];

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">{t("openMenu")}</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>{t("label")}</DropdownMenuLabel>
          {canUpdate && (
            <DropdownMenuItem onClick={() => setEditUserOpen(true)}>
              {t("edit")}
            </DropdownMenuItem>
          )}
          {canAssignRoles && (
            <DropdownMenuItem onClick={() => setAssignRolesOpen(true)}>
              {t("assignRoles")}
            </DropdownMenuItem>
          )}
          {canDelete && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-red-600 focus:text-red-600"
                onClick={() => setDeleteUserOpen(true)}
              >
                {t("delete")}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <EditUserDialog
        key={user.id}
        user={user}
        open={editUserOpen}
        onOpenChange={setEditUserOpen}
      />

      <AssignRolesDialog
        userId={user.id}
        userName={`${user.firstName} ${user.lastName}`}
        currentRoles={currentRoleIds}
        open={assignRolesOpen}
        onOpenChange={setAssignRolesOpen}
      />

      <DeleteConfirmDialog
        open={deleteUserOpen}
        onOpenChange={setDeleteUserOpen}
        title={t("confirmTitle")}
        description={t("confirmDeleteDesc", { item: `${user.firstName} ${user.lastName}` })}
        action={() => deleteUserAction(user.id)}
        successMessage={t("successDelete")}
      />
    </>
  );
}
