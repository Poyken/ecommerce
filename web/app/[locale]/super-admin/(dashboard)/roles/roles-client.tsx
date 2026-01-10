"use client";
import { DataTablePagination } from "@/components/shared/data-table-pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { deleteRoleAction } from "@/features/admin/actions";
import {
  AdminEmptyState,
  AdminPageHeader,
  AdminTableWrapper,
} from "@/features/admin/components/admin-page-components";
import { AssignPermissionsDialog } from "@/features/admin/components/assign-permissions-dialog";
import { CreateRoleDialog } from "@/features/admin/components/create-role-dialog";
import { DeleteConfirmDialog } from "@/features/admin/components/delete-confirm-dialog";
import { EditRoleDialog } from "@/features/admin/components/edit-role-dialog";
import { useAuth } from "@/features/auth/providers/auth-provider";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { PaginationMeta } from "@/types/dtos";
import { RoleWithPermissions } from "@/types/models";
import { format } from "date-fns";
import {
  Edit2,
  Key,
  MoreHorizontal,
  Plus,
  Search,
  Shield,
  Trash2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

/**
 * =====================================================================
 * ROLES PAGE CLIENT - Giao diện Quản lý Role & Permission
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. SEARCH WITH URL SYNC:
 * - Khi user search, URL sẽ được update (`?search=...`).
 * - Debounce 500ms để tránh spam URL update liên tục.
 * - `useTransition` giúp UI không bị freeze khi navigate.
 *
 * 2. PERMISSION CHECKING:
 * - `canCreate`, `canUpdate`... được check qua `useAuth().hasPermission`.
 * - Ẩn/Hiện nút bấm dựa trên quyền của Admin đang login.
 * =====================================================================
 */
export function RolesPageClient({
  roles,
  meta,
}: {
  roles: RoleWithPermissions[];
  meta?: PaginationMeta;
}) {
  const t = useTranslations("admin");
  const { hasPermission } = useAuth();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [permissionsDialogOpen, setPermissionsDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<RoleWithPermissions | null>(
    null
  );
  const [isPending, startTransition] = useTransition();

  const canCreate = hasPermission("role:create");
  const canUpdate = hasPermission("role:update");
  const canDelete = hasPermission("role:delete");
  const canAssignPermissions = hasPermission("role:update");

  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(
    searchParams.get("search") || ""
  );

  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    const currentSearch = params.get("search") || "";

    if (currentSearch !== debouncedSearchTerm) {
      startTransition(() => {
        const params = new URLSearchParams(searchParams.toString());
        if (debouncedSearchTerm) {
          params.set("search", debouncedSearchTerm);
          params.set("page", "1"); // Reset to page 1 on search
        } else {
          params.delete("search");
        }
        router.push(`/super-admin/roles?${params.toString()}` as any);
      });
    }
  }, [debouncedSearchTerm, router, searchParams]);

  const openEdit = (role: RoleWithPermissions) => {
    setSelectedRole(role);
    setEditDialogOpen(true);
  };

  const openDelete = (role: RoleWithPermissions) => {
    setSelectedRole(role);
    setDeleteDialogOpen(true);
  };

  const openPermissions = (role: RoleWithPermissions) => {
    setSelectedRole(role);
    setPermissionsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* 1. Standard Admin Header */}
      <AdminPageHeader
        title={t("roles.management")}
        subtitle={`${meta?.total || 0} roles defined in system`}
        icon={<Shield className="h-5 w-5" />}
        stats={[
          { label: "total", value: meta?.total || 0, variant: "default" },
        ]}
        actions={
          canCreate ? (
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {t("roles.createNew")}
            </Button>
          ) : undefined
        }
      />

      {/* 2. Search Bar */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("roles.searchPlaceholder")}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* 3. Table Wrapper */}
      <AdminTableWrapper isLoading={isPending}>
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[20%]">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  {t("roles.roleNameLabel")}
                </div>
              </TableHead>
              <TableHead className="w-[50%]">
                {t("permissions.title")}
              </TableHead>
              <TableHead>{t("roles.createdLabel")}</TableHead>
              {(canAssignPermissions || canUpdate || canDelete) && (
                <TableHead className="text-right w-[100px]">
                  {t("actions")}
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {roles && roles.length > 0 ? (
              roles.map((role: RoleWithPermissions) => (
                <TableRow
                  key={role.id}
                  className="hover:bg-muted/30 transition-colors"
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Key className="h-5 w-5" />
                      </div>
                      <div className="font-medium text-foreground">
                        {role.name}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1.5">
                      {role.permissions?.slice(0, 4).map((rp) => (
                        <Badge
                          key={rp.permission?.id}
                          variant="secondary"
                          className="text-xs bg-muted/50 hover:bg-muted border-border font-normal"
                        >
                          {rp.permission?.name}
                        </Badge>
                      ))}
                      {role.permissions?.length > 4 && (
                        <Badge
                          variant="outline"
                          className="text-xs border-dashed text-muted-foreground"
                        >
                          +{role.permissions.length - 4}
                        </Badge>
                      )}
                      {(!role.permissions || role.permissions.length === 0) && (
                        <span className="text-muted-foreground/50 text-sm italic">
                          {t("none")}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {format(new Date(role.createdAt), "dd/MM/yyyy")}
                  </TableCell>
                  {(canAssignPermissions || canUpdate || canDelete) && (
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                          >
                            <span className="sr-only">{t("openMenu")}</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuLabel>{t("actions")}</DropdownMenuLabel>
                          {canAssignPermissions && (
                            <DropdownMenuItem
                              onClick={() => openPermissions(role)}
                              className="cursor-pointer"
                            >
                              <Key className="mr-2 h-4 w-4 text-blue-500" />
                              {t("roles.assignPermissions")}
                            </DropdownMenuItem>
                          )}
                          {canUpdate && (
                            <DropdownMenuItem
                              onClick={() => openEdit(role)}
                              className="cursor-pointer"
                            >
                              <Edit2 className="mr-2 h-4 w-4 text-amber-500" />
                              {t("roles.edit")}
                            </DropdownMenuItem>
                          )}
                          {canDelete && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-red-600 focus:text-red-600 cursor-pointer"
                                onClick={() => openDelete(role)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
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
                  className="h-24 text-center"
                >
                  <AdminEmptyState
                    icon={Shield}
                    title={t("noFound", { item: t("roles.title") })}
                    description={t("roles.searchPlaceholder")}
                    action={
                      canCreate ? (
                        <Button onClick={() => setCreateDialogOpen(true)}>
                          <Plus className="mr-2 h-4 w-4" />
                          {t("roles.createNew")}
                        </Button>
                      ) : undefined
                    }
                  />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </AdminTableWrapper>

      {meta && (
        <DataTablePagination
          page={meta.page}
          total={meta.total}
          limit={meta.limit}
        />
      )}

      {/* Dialogs */}
      <CreateRoleDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />

      {selectedRole && (
        <>
          <EditRoleDialog
            key={selectedRole.id}
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
                ?.map((rp) => rp.permission?.name)
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
