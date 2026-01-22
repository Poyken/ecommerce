// GIẢI THÍCH CHO THỰC TẬP SINH:
// =================================================================================================
// PERMISSIONS CLIENT PAGE - GIAO DIỆN QUẢN LÝ QUYỀN
// =================================================================================================
//
// Component này cung cấp giao diện CRUD (Create, Read, Update, Delete) cho Permissions.
// Mặc dù Permissions thường ít khi thay đổi (thường được define cứng trong code), UI này hữu ích
// cho việc review hoặc điều chỉnh thủ công trong các trường hợp đặc biệt.
//
// TÍNH NĂNG CHÍNH:
// 1. Tìm kiếm (Search): Lọc permissions theo tên để nhanh chóng tìm quyền cần sửa.
// 2. Dialogs: Sử dụng các Dialog component tách biệt (`CreatePermissionDialog`, `EditPermissionDialog`)
//    để giữ code sạch sẽ và dễ bảo trì.
// 3. Delete Confirmation: Luôn hỏi lại trước khi xóa để tránh thao tác nhầm lẫn nguy hiểm.
// =================================================================================================
"use client";

import { GlassButton } from "@/components/shared/glass-button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  CreatePermissionDialog,
  DeleteConfirmDialog,
  EditPermissionDialog,
} from "@/features/admin/components";
import { AdminPageHeader, AdminTableWrapper, AdminEmptyState } from "@/features/admin/components/ui/admin-page-components";
import { AdminSearchInput } from "@/features/admin/components/ui/admin-search-input";
import { deletePermissionAction } from "@/features/admin/actions";
import { Permission } from "@/types/models";
import { Edit2, Plus, Shield, Trash2, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { useToast } from "@/components/ui/use-toast";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";

interface PermissionsPageClientProps {
  initialPermissions: Permission[];
}

export function PermissionsPageClient({
  initialPermissions,
}: PermissionsPageClientProps) {
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  // Search State
  const initialSearch = searchParams.get("search") || "";
  const [searchTerm, setSearchTerm] = useState(initialSearch);

  const [selectedPermission, setSelectedPermission] =
    useState<Permission | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const handleSearch = useDebouncedCallback((term: string) => {
    const params = new URLSearchParams(searchParams);
    if (term) {
      params.set("search", term);
    } else {
      params.delete("search");
    }
    startTransition(() => {
      router.replace(`${pathname}?${params.toString()}` as any);
    });
  }, 300);

  const onSearchChange = (value: string) => {
    setSearchTerm(value);
    handleSearch(value);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <CreatePermissionDialog
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
      />
      <AdminPageHeader
        title="Permissions"
        subtitle="Manage system permissions."
        icon={<Shield className="text-cyan-500 fill-cyan-500/10" />}
        variant="cyan"
        stats={[
          { label: "Total Permissions", value: initialPermissions.length, variant: "slate" }
        ]}
        actions={
          <GlassButton
            className="bg-primary text-primary-foreground"
            onClick={() => setIsCreateOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Permission
          </GlassButton>
        }
      />
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="w-full md:w-80">
          <AdminSearchInput
            placeholder="Search permissions..."
            value={searchTerm}
            onChange={onSearchChange}
          />
        </div>
      </div>

      <AdminTableWrapper >
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Permission Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialPermissions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3}>
                  <AdminEmptyState
                    icon={Shield}
                    title="No permissions found"
                    description="No permissions match your search criteria."
                    variant="minimal"
                  />
                </TableCell>
              </TableRow>
            ) : (
              initialPermissions.map((permission) => (
                <TableRow
                  key={permission.id}
                  className="hover:bg-muted/30 transition-colors"
                >
                  <TableCell className="font-mono text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <Shield size={14} className="text-muted-foreground" />
                      {permission.name}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    System Permission
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <GlassButton
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedPermission(permission);
                          setIsEditOpen(true);
                        }}
                      >
                        <Edit2 className="h-4 w-4" />
                      </GlassButton>
                      <GlassButton
                        size="sm"
                        variant="ghost"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => {
                          setSelectedPermission(permission);
                          setIsDeleteOpen(true);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </GlassButton>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </AdminTableWrapper>
      {selectedPermission && (
        <EditPermissionDialog
          key={selectedPermission.id}
          open={isEditOpen}
          onOpenChange={setIsEditOpen}
          permissionId={selectedPermission.id}
          currentName={selectedPermission.name}
        />
      )}
      <DeleteConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        action={async () => {
          if (!selectedPermission)
            return { success: false, error: "No permission selected" };
          return await deletePermissionAction(selectedPermission.id);
        }}
        title="Delete Permission"
        description={`Are you sure you want to delete permission "${selectedPermission?.name}"?`}
      />
    </div>
  );
}
