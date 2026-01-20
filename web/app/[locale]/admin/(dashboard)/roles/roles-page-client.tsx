// GIẢI THÍCH CHO THỰC TẬP SINH:
// =================================================================================================
// ROLES CLIENT PAGE - UI QUẢN LÝ ROLES
// =================================================================================================
//
// Client Component này cung cấp giao diện tương tác đầy đủ cho CRUD Roles.
//
// CÁC KỸ THUẬT UX NÂNG CAO:
// 1. Debounced Search:
//    - Sử dụng `useDebouncedCallback` để delay việc search 300ms sau khi người dùng ngừng gõ.
//    - Tránh spam request lên URL/Server.
// 2. URL State Sync:
//    - Đồng bộ từ khóa tìm kiếm lên URL query params (`?search=...`).
//    - Giúp người dùng có thể bookmark hoặc share link kết quả tìm kiếm.
// 3. React Transitions:
//    - Dùng `useTransition` khi update URL để tránh blocking UI, giữ giao diện mượt mà.
//
// COMPONENTS:
// - `GlassButton`: Button với hiệu ứng kính mờ (frosted glass) theo design system.
// - `AdminPageHeader`: Component tiêu đề chuẩn hóa cho các trang quản trị.
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
  CreateRoleDialog,
  DeleteConfirmDialog,
  EditRoleDialog,
} from "@/features/admin/components";
import { AdminPageHeader, AdminTableWrapper, AdminEmptyState } from "@/features/admin/components/ui/admin-page-components";
import { AdminSearchInput } from "@/features/admin/components/ui/admin-search-input";
import { deleteRoleAction } from "@/features/admin/actions";
import { Role } from "@/types/models";
import { Edit2, Plus, Shield, Trash2, Search } from "lucide-react";

import { useState, useTransition } from "react";
import { useToast } from "@/components/ui/use-toast";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";

interface RolesPageClientProps {
  initialRoles: Role[];
}

export function RolesPageClient({ initialRoles }: RolesPageClientProps) {
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const initialSearch = searchParams.get("search") || "";
  const [searchTerm, setSearchTerm] = useState(initialSearch);

  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

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

  const handleDeleteAction = async () => {
    if (!selectedRole) return { success: false, error: "No role selected" };
    const res = await deleteRoleAction(selectedRole.id);
    if (res.success) {
      router.refresh();
    }
    return res;
  };

  const filteredRoles = searchTerm
    ? initialRoles.filter((r) =>
        r.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : initialRoles;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <AdminPageHeader
        title="Roles"
        subtitle="Manage system roles."
        icon={<Shield className="text-blue-500 fill-blue-500/10" />}
        variant="blue"
        stats={[
          { label: "Total Roles", value: filteredRoles.length, variant: "slate" }
        ]}
        actions={
          <>
            <GlassButton
              className="bg-primary text-primary-foreground"
              onClick={() => setIsCreateOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Role
            </GlassButton>
            <CreateRoleDialog
              open={isCreateOpen}
              onOpenChange={setIsCreateOpen}
            />
          </>
        }
      />
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="w-full md:w-80">
          <AdminSearchInput
            placeholder="Search roles..."
            value={searchTerm}
            onChange={onSearchChange}
          />
        </div>
      </div>

      <AdminTableWrapper variant="blue">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead>Role Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRoles.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3}>
                  <AdminEmptyState
                    icon={Shield}
                    title="No roles found"
                    description="No roles match your search criteria."
                    variant="minimal"
                  />
                </TableCell>
              </TableRow>
            ) : (
              filteredRoles.map((role) => (
                <TableRow
                  key={role.id}
                  className="hover:bg-muted/30 transition-colors"
                >
                  <TableCell className="font-mono text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <Shield size={14} className="text-muted-foreground" />
                      {role.name}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    System Role
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <GlassButton
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setSelectedRole(role);
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
                          setSelectedRole(role);
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
      {selectedRole && (
        <EditRoleDialog
          key={selectedRole.id}
          open={isEditOpen}
          onOpenChange={setIsEditOpen}
          roleId={selectedRole.id}
          currentName={selectedRole.name}
        />
      )}
      <DeleteConfirmDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        action={handleDeleteAction}
        title="Delete Role"
        description={`Are you sure you want to delete role "${selectedRole?.name}"?`}
      />
    </div>
  );
}
