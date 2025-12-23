"use client";
import { deleteRoleAction } from "@/actions/admin";
import { AssignPermissionsDialog } from "@/components/organisms/admin/assign-permissions-dialog";
import { CreateRoleDialog } from "@/components/organisms/admin/create-role-dialog";
import { DeleteConfirmDialog } from "@/components/organisms/admin/delete-confirm-dialog";
import { EditRoleDialog } from "@/components/organisms/admin/edit-role-dialog";
import { Badge } from "@/components/atoms/badge";
import { Button } from "@/components/atoms/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/atoms/dropdown-menu";
import { GlassCard } from "@/components/atoms/glass-card";
import { Input } from "@/components/atoms/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/atoms/table";
import { useDebounce } from "@/hooks/use-debounce";
import { useAuth } from "@/providers/auth-provider";
import { MoreHorizontal } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export function RolesPageClient({ roles }: { roles: any[] }) {
  /**
   * =====================================================================
   * ADMIN ROLES CLIENT - Quản lý chuẩn bị
   * =====================================================================
   *
   * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
   *
   * 1. PERMISSIONS DISPLAY:
   * - Một Role có nhiều Permissions.
   * - UI chỉ hiển thị tối đa 3 permissions đầu tiên để tránh vỡ layout bảng.
   * - Số còn lại được gom vào badge "+X more".
   *
   * 2. DROPDOWN MENU ACTIONS:
   * - Sử dụng `DropdownMenu` của Radix UI (qua shadcn/ui) để gom nhóm các hành động.
   * - Giúp giao diện gọn gàng hơn so với việc để nhiều nút bấm rời rạc.
   *
   * 3. DIALOGS:
   * - Tách biệt logic Create, Edit, Delete, Assign Permissions ra các component Dialog riêng.
   * - Giúp file này không bị quá dài và dễ bảo trì.
   * =====================================================================
   */
  const t = useTranslations("admin");
  const { hasPermission } = useAuth();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [permissionsDialogOpen, setPermissionsDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<any>(null);

  const canCreate = hasPermission("role:create");
  const canUpdate = hasPermission("role:update");
  const canDelete = hasPermission("role:delete");
  const canAssignPermissions = hasPermission("role:update"); // Assuming update permission is needed for assigning permissions

  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(
    searchParams.get("search") || ""
  );

  // Debounced search term
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Update URL when debounced search term changes
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    const currentSearch = params.get("search") || "";

    if (currentSearch !== debouncedSearchTerm) {
      if (debouncedSearchTerm) {
        params.set("search", debouncedSearchTerm);
      } else {
        params.delete("search");
      }
      router.push(`/admin/roles?${params.toString()}` as any);
    }
  }, [debouncedSearchTerm, router, searchParams]);

  const openEdit = (role: any) => {
    setSelectedRole(role);
    setEditDialogOpen(true);
  };

  const openDelete = (role: any) => {
    setSelectedRole(role);
    setDeleteDialogOpen(true);
  };

  const openPermissions = (role: any) => {
    setSelectedRole(role);
    setPermissionsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">{t("roles.management")}</h1>
        {canCreate && (
          <Button onClick={() => setCreateDialogOpen(true)}>
            {t("roles.createNew")}
          </Button>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <Input
          placeholder={t("roles.searchPlaceholder")}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <GlassCard className="p-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-foreground">
            {t("roles.allLabel")}
          </h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-white/5">
              <TableHead className="text-muted-foreground uppercase tracking-wider text-xs font-bold">
                {t("roles.roleNameLabel")}
              </TableHead>
              <TableHead className="text-muted-foreground uppercase tracking-wider text-xs font-bold">
                {t("permissions.title")}
              </TableHead>
              <TableHead className="text-muted-foreground uppercase tracking-wider text-xs font-bold">
                {t("roles.createdLabel")}
              </TableHead>
              {(canAssignPermissions || canUpdate || canDelete) && (
                <TableHead className="text-right text-muted-foreground uppercase tracking-wider text-xs font-bold">
                  {t("actions")}
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {roles && roles.length > 0 ? (
              roles.map((role: any) => (
                <TableRow
                  key={role.id}
                  className="border-white/10 hover:bg-white/5 transition-colors"
                >
                  <TableCell className="font-medium text-foreground">
                    {role.name}
                  </TableCell>
                  <TableCell className="max-w-md">
                    <div className="flex flex-wrap gap-1">
                      {role.permissions?.slice(0, 3).map((rp: any) => (
                        <Badge
                          key={rp.permission?.id}
                          variant="secondary"
                          className="text-xs bg-primary/10 text-primary border-primary/20"
                        >
                          {rp.permission?.name}
                        </Badge>
                      ))}
                      {role.permissions?.length > 3 && (
                        <Badge
                          variant="outline"
                          className="text-xs border-white/10 text-muted-foreground"
                        >
                          {t("roles.moreCount", {
                            count: role.permissions.length - 3,
                          })}
                        </Badge>
                      )}
                      {(!role.permissions || role.permissions.length === 0) && (
                        <span className="text-muted-foreground/50 text-sm">
                          {t("none")}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(role.createdAt).toLocaleDateString()}
                  </TableCell>
                  {(canAssignPermissions || canUpdate || canDelete) && (
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            className="h-8 w-8 p-0 hover:bg-white/10 text-muted-foreground hover:text-foreground"
                          >
                            <span>
                              <span className="sr-only">{t("openMenu")}</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel className="text-muted-foreground">
                            {t("actions")}
                          </DropdownMenuLabel>
                          {canAssignPermissions && (
                            <DropdownMenuItem
                              onClick={() => openPermissions(role)}
                              className="cursor-pointer"
                            >
                              {t("roles.assignPermissions")}
                            </DropdownMenuItem>
                          )}
                          {canUpdate && (
                            <DropdownMenuItem
                              onClick={() => openEdit(role)}
                              className="cursor-pointer"
                            >
                              {t("roles.edit")}
                            </DropdownMenuItem>
                          )}
                          {canDelete && (
                            <>
                              <DropdownMenuSeparator className="bg-white/10" />
                              <DropdownMenuItem
                                className="text-red-500 focus:text-red-400 focus:bg-red-500/10 cursor-pointer"
                                onClick={() => openDelete(role)}
                              >
                                {t("roles.delete")}
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={
                    canAssignPermissions || canUpdate || canDelete ? 4 : 3
                  }
                  className="text-center py-8 text-muted-foreground"
                >
                  {t("noFound", { item: t("roles.title") })}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </GlassCard>

      <CreateRoleDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />

      {selectedRole && (
        <>
          <EditRoleDialog
            roleId={selectedRole.id}
            currentName={selectedRole.name}
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
          />
          <DeleteConfirmDialog
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
            title={t("confirmTitle")}
            description={t("confirmDeleteDesc", { item: selectedRole.name })}
            action={() => deleteRoleAction(selectedRole.id)}
            successMessage={t("roles.successDelete")}
          />
          <AssignPermissionsDialog
            roleId={selectedRole.id}
            roleName={selectedRole.name}
            currentPermissions={
              selectedRole.permissions
                ?.map((rp: any) => rp.permission?.name)
                .filter(Boolean) || []
            }
            open={permissionsDialogOpen}
            onOpenChange={setPermissionsDialogOpen}
          />
        </>
      )}
    </div>
  );
}
