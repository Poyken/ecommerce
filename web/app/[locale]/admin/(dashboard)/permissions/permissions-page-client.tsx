"use client";

import { GlassButton } from "@/components/shared/glass-button";
import { Badge } from "@/components/ui/badge";
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
import { AdminPageHeader } from "@/features/admin/components/admin-page-components";
import { AdminSearchInput } from "@/features/admin/components/admin-search-input";
import { deletePermissionAction } from "@/features/admin/actions";
import { Permission } from "@/types/models";
import { Edit2, Plus, Shield, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { useToast } from "@/components/shared/use-toast";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";

interface PermissionsPageClientProps {
  initialPermissions: Permission[];
}

export function PermissionsPageClient({
  initialPermissions,
}: PermissionsPageClientProps) {
  const t = useTranslations("admin");
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Search State
  const initialSearch = searchParams.get("search") || "";
  const [searchTerm, setSearchTerm] = useState(initialSearch);

  const [selectedPermission, setSelectedPermission] =
    useState<Permission | null>(null);
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
      router.replace(`${pathname}?${params.toString()}`);
    });
  }, 300);

  const onSearchChange = (value: string) => {
    setSearchTerm(value);
    handleSearch(value);
  };

  const handleDelete = async () => {
    if (!selectedPermission) return;
    const res = await deletePermissionAction(selectedPermission.id);
    if (res.success) {
      toast({
        variant: "success",
        title: "Success",
        description: "Permission deleted successfully",
      });
      router.refresh();
      setIsDeleteOpen(false);
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: res.error,
      });
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Permissions"
        subtitle="Manage system permissions."
        actions={
          <CreatePermissionDialog>
            <GlassButton className="bg-primary text-primary-foreground">
              <Plus className="mr-2 h-4 w-4" />
              Add Permission
            </GlassButton>
          </CreatePermissionDialog>
        }
      />

      <div className="flex items-center justify-between gap-4 bg-background/50 p-4 rounded-xl border border-border/50 backdrop-blur-sm">
        <AdminSearchInput
          placeholder="Search permissions..."
          value={searchTerm}
          onChange={onSearchChange}
        />
        <div className="text-sm text-muted-foreground">
          Total:{" "}
          <span className="font-medium text-foreground">
            {initialPermissions.length}
          </span>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card/50 backdrop-blur-sm overflow-hidden">
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
                <TableCell
                  colSpan={3}
                  className="h-24 text-center text-muted-foreground"
                >
                  No permissions found.
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
      </div>

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
        onConfirm={handleDelete}
        title="Delete Permission"
        description={`Are you sure you want to delete permission "${selectedPermission?.name}"?`}
      />
    </div>
  );
}
