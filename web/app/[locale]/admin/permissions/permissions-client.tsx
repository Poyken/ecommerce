"use client";

import { deletePermissionAction } from "@/actions/admin";
import { CreatePermissionDialog } from "@/components/organisms/admin/create-permission-dialog";
import { DeleteConfirmDialog } from "@/components/organisms/admin/delete-confirm-dialog";
import { EditPermissionDialog } from "@/components/organisms/admin/edit-permission-dialog";
import { Badge } from "@/components/atoms/badge";
import { Button } from "@/components/atoms/button";
import { GlassCard } from "@/components/atoms/glass-card";
import { Input } from "@/components/atoms/input";
import { useAuth } from "@/providers/auth-provider";
import { Edit2, Plus, Search, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";

export function PermissionsPageClient({ permissions }: { permissions: any[] }) {
  /**
   * =====================================================================
   * ADMIN PERMISSIONS CLIENT - Quản lý quyền hạn
   * =====================================================================
   *
   * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
   *
   * 1. GROUPING LOGIC (`useMemo`):
   * - Permissions thường có dạng `resource:action` (vd: `user:create`, `product:delete`).
   * - Logic này tự động gom nhóm các quyền theo `resource` (User, Product...).
   * - Dùng `useMemo` để chỉ tính toán lại khi danh sách `permissions` thay đổi -> Tối ưu hiệu năng.
   *
   * 2. CLIENT-SIDE SEARCH:
   * - Search hoạt động trên cả tên Resource (nhóm) và tên Permission (chi tiết).
   * - Filter trực tiếp trên object `groupedPermissions` đã được tính toán trước đó.
   *
   * 3. UI CARD LAYOUT:
   * - Hiển thị dạng Grid Card thay vì Table để dễ nhìn hơn với cấu trúc phân nhóm.
   * =====================================================================
   */
  const t = useTranslations("admin");
  const { hasPermission } = useAuth();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedPermission, setSelectedPermission] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const canCreate = hasPermission("permission:create");
  const canUpdate = hasPermission("permission:update");
  const canDelete = hasPermission("permission:delete");

  const openEdit = (permission: any) => {
    setSelectedPermission(permission);
    setEditDialogOpen(true);
  };

  const openDelete = (permission: any) => {
    setSelectedPermission(permission);
    setDeleteDialogOpen(true);
  };

  // Nhóm quyền theo tài nguyên (ví dụ: "user:read" -> tài nguyên "user")
  const groupedPermissions = useMemo(() => {
    const groups: Record<string, any[]> = {};

    permissions.forEach((perm) => {
      // Thử tách bằng dấu hai chấm hoặc gạch dưới, mặc định là "Other"
      let resource = "Other";
      if (perm.name.includes(":")) {
        resource = perm.name.split(":")[0];
      } else if (perm.name.includes("_")) {
        resource = perm.name.split("_")[0];
      } else {
        resource = perm.name; // Dự phòng nếu không có dấu phân cách
      }

      // Viết hoa chữ cái đầu
      resource = resource.charAt(0).toUpperCase() + resource.slice(1);

      if (!groups[resource]) {
        groups[resource] = [];
      }
      groups[resource].push(perm);
    });

    return groups;
  }, [permissions]);

  // Lọc nhóm dựa trên tìm kiếm
  const filteredGroups = useMemo(() => {
    if (!searchTerm) return groupedPermissions;

    const lowerSearch = searchTerm.toLowerCase();
    const filtered: Record<string, any[]> = {};

    Object.entries(groupedPermissions).forEach(([resource, perms]) => {
      // Kiểm tra xem tên tài nguyên có khớp không
      if (resource.toLowerCase().includes(lowerSearch)) {
        filtered[resource] = perms;
      } else {
        // Kiểm tra xem bất kỳ quyền nào trong nhóm có khớp không
        const matchingPerms = perms.filter((p) =>
          p.name.toLowerCase().includes(lowerSearch)
        );
        if (matchingPerms.length > 0) {
          filtered[resource] = matchingPerms;
        }
      }
    });

    return filtered;
  }, [groupedPermissions, searchTerm]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">{t("permissions.management")}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {t("permissions.description")}
          </p>
        </div>
        {canCreate && (
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> {t("permissions.createNew")}
          </Button>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder={t("permissions.searchPlaceholder")}
          className="pl-10 max-w-md"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(filteredGroups).length > 0 ? (
          Object.entries(filteredGroups).map(([resource, perms]) => (
            <GlassCard
              key={resource}
              className="flex flex-col h-full hover:bg-white/5 transition-colors duration-200"
            >
              <div className="p-6 pb-3 flex flex-row items-center justify-between space-y-0">
                <h3 className="text-lg font-bold text-foreground">
                  {resource}
                </h3>
                <Badge
                  variant="secondary"
                  className="rounded-full px-2.5 py-0.5 bg-primary/10 text-primary border-primary/20 font-medium"
                >
                  {perms.length}
                </Badge>
              </div>
              <div className="p-6 pt-0 flex-grow">
                <div className="flex flex-wrap gap-2.5">
                  {perms.map((perm) => (
                    <div
                      key={perm.id}
                      className="group relative inline-flex items-center"
                    >
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-sm text-muted-foreground hover:text-foreground hover:bg-white/10 hover:border-white/20 transition-colors">
                        <span className="font-medium">{perm.name}</span>
                        {(canUpdate || canDelete) && (
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 -mr-1">
                            {canUpdate && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEdit(perm);
                                }}
                                className="p-1 text-blue-400 hover:text-blue-300 hover:bg-blue-400/10 rounded-full transition-colors"
                                title={t("edit")}
                              >
                                <Edit2 className="h-3 w-3" />
                              </button>
                            )}
                            {canDelete && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openDelete(perm);
                                }}
                                className="p-1 text-red-400 hover:text-red-300 hover:bg-red-400/10 rounded-full transition-colors"
                                title={t("delete")}
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </GlassCard>
          ))
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center py-16 text-muted-foreground bg-white/5 rounded-lg border border-dashed border-white/10">
            <Search className="h-10 w-10 text-muted-foreground/50 mb-3" />
            <p className="text-lg font-medium">{t("permissions.noFound")}</p>
            <p className="text-sm text-muted-foreground/70">
              {t("permissions.adjustSearch")}
            </p>
          </div>
        )}
      </div>

      <CreatePermissionDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />

      {selectedPermission && (
        <>
          <EditPermissionDialog
            permissionId={selectedPermission.id}
            currentName={selectedPermission.name}
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
          />
          <DeleteConfirmDialog
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
            title={t("confirmTitle")}
            description={t("confirmDeleteDesc", { item: selectedPermission.name })}
            action={() => deletePermissionAction(selectedPermission.id)}
            successMessage={t("permissions.successDelete")}
          />
        </>
      )}
    </div>
  );
}
