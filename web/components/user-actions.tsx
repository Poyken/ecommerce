"use client";

import { AssignRolesDialog } from "@/components/assign-roles-dialog";
import { DeleteUserDialog } from "@/components/delete-user-dialog";
import { EditUserDialog } from "@/components/edit-user-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal } from "lucide-react";
import { useState } from "react";

interface UserActionsProps {
  user: any;
}

export function UserActions({ user }: UserActionsProps) {
  const [assignRolesOpen, setAssignRolesOpen] = useState(false);
  const [editUserOpen, setEditUserOpen] = useState(false);
  const [deleteUserOpen, setDeleteUserOpen] = useState(false);

  const currentRoleIds = user.roles?.map((ur: any) => ur.role?.id) || [];

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => setEditUserOpen(true)}>
            Edit User
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setAssignRolesOpen(true)}>
            Assign Roles
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-red-600 focus:text-red-600"
            onClick={() => setDeleteUserOpen(true)}
          >
            Delete User
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <EditUserDialog
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

      <DeleteUserDialog
        userId={user.id}
        userName={`${user.firstName} ${user.lastName}`}
        open={deleteUserOpen}
        onOpenChange={setDeleteUserOpen}
      />
    </>
  );
}
