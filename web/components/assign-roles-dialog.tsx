"use client";

import { assignRolesAction, getRolesAction } from "@/actions/admin";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

interface AssignRolesDialogProps {
  userId: string;
  userName: string;
  currentRoles: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AssignRolesDialog({
  userId,
  userName,
  currentRoles,
  open,
  onOpenChange,
}: AssignRolesDialogProps) {
  const { toast } = useToast();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [roles, setRoles] = useState<any[]>([]);
  const [selectedRoleNames, setSelectedRoleNames] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      getRolesAction().then(({ data }) => {
        if (data) {
          setRoles(data);
          // Chuyển đổi ID vai trò hiện tại thành tên
          const currentRoleNames = data
            .filter((role: any) => currentRoles.includes(role.id))
            .map((role: any) => role.name);
          setSelectedRoleNames(currentRoleNames);
        }
      });
    }
  }, [open, currentRoles]);

  const handleSubmit = () => {
    startTransition(async () => {
      const result = await assignRolesAction(userId, selectedRoleNames);
      if (result.success) {
        toast({
          title: "Success",
          description: "Roles assigned successfully",
        });
        onOpenChange(false);
        // Server action đã gọi revalidatePath - không cần router.refresh
      } else {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      }
    });
  };

  const toggleRole = (roleName: string) => {
    setSelectedRoleNames((prev) =>
      prev.includes(roleName)
        ? prev.filter((name) => name !== roleName)
        : [...prev, roleName]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Roles</DialogTitle>
          <DialogDescription>
            Select roles for user: {userName}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {roles.map((role) => (
            <div key={role.id} className="flex items-center space-x-2">
              <Checkbox
                id={role.id}
                checked={selectedRoleNames.includes(role.name)}
                onCheckedChange={() => toggleRole(role.name)}
                disabled={isPending}
              />
              <label
                htmlFor={role.id}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {role.name}
              </label>
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isPending}>
            {isPending ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
