"use client";

import { GlassButton } from "@/components/shared/glass-button";
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
import { AdminPageHeader } from "@/features/admin/components/admin-page-components";
import { AdminSearchInput } from "@/features/admin/components/admin-search-input";
import { deleteRoleAction } from "@/features/admin/actions";
import { Role } from "@/types/models";
import { Edit2, Plus, Shield, Trash2 } from "lucide-react";

import { useState, useTransition } from "react";
import { useToast } from "@/components/shared/use-toast";
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
    <div className="space-y-6">
      <AdminPageHeader
        title="Roles"
        subtitle="Manage system roles."
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

      <div className="flex items-center justify-between gap-4 bg-background/50 p-4 rounded-xl border border-border/50 backdrop-blur-sm">
        <AdminSearchInput
          placeholder="Search roles..."
          value={searchTerm}
          onChange={onSearchChange}
        />
        <div className="text-sm text-muted-foreground">
          Total:{" "}
          <span className="font-medium text-foreground">
            {filteredRoles.length}
          </span>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card/50 backdrop-blur-sm overflow-hidden">
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
                <TableCell
                  colSpan={3}
                  className="h-24 text-center text-muted-foreground"
                >
                  No roles found.
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
      </div>

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
