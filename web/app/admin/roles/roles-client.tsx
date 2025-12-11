"use client";

import { AssignPermissionsDialog } from "@/components/assign-permissions-dialog";
import { CreateRoleDialog } from "@/components/create-role-dialog";
import { DeleteRoleDialog } from "@/components/delete-role-dialog";
import { EditRoleDialog } from "@/components/edit-role-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { MoreHorizontal } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export function RolesPageClient({ roles }: { roles: any[] }) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [permissionsDialogOpen, setPermissionsDialogOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<any>(null);

  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(
    searchParams.get("search") || ""
  );

  // Tìm kiếm với Debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      const currentSearch = params.get("search") || "";

      // Chỉ điều hướng nếu từ khóa tìm kiếm thực sự thay đổi
      if (currentSearch !== searchTerm) {
        if (searchTerm) {
          params.set("search", searchTerm);
        } else {
          params.delete("search");
        }
        router.push(`/admin/roles?${params.toString()}`);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, router, searchParams]);

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
        <h1 className="text-3xl font-bold">Roles Management</h1>
        <Button onClick={() => setCreateDialogOpen(true)}>Create Role</Button>
      </div>

      <div className="flex items-center space-x-2">
        <Input
          placeholder="Search roles..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Roles</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Role Name</TableHead>
                <TableHead>Permissions</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles && roles.length > 0 ? (
                roles.map((role: any) => (
                  <TableRow key={role.id}>
                    <TableCell className="font-medium">{role.name}</TableCell>
                    <TableCell className="max-w-md">
                      <div className="flex flex-wrap gap-1">
                        {role.permissions?.slice(0, 3).map((rp: any) => (
                          <Badge
                            key={rp.permission?.id}
                            variant="secondary"
                            className="text-xs"
                          >
                            {rp.permission?.name}
                          </Badge>
                        ))}
                        {role.permissions?.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{role.permissions.length - 3} more
                          </Badge>
                        )}
                        {(!role.permissions ||
                          role.permissions.length === 0) && (
                          <span className="text-gray-400 text-sm">None</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(role.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem
                            onClick={() => openPermissions(role)}
                          >
                            Manage Permissions
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEdit(role)}>
                            Edit Role
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600 focus:text-red-600"
                            onClick={() => openDelete(role)}
                          >
                            Delete Role
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center py-8 text-gray-500"
                  >
                    No roles found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

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
          <DeleteRoleDialog
            roleId={selectedRole.id}
            roleName={selectedRole.name}
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
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
