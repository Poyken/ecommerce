"use client";

import { assignPermissionsAction, getPermissionsAction } from "@/actions/admin";
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
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState, useTransition } from "react";

interface AssignPermissionsDialogProps {
  roleId: string;
  roleName: string;
  currentPermissions: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AssignPermissionsDialog({
  roleId,
  roleName,
  currentPermissions,
  open,
  onOpenChange,
}: AssignPermissionsDialogProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [permissions, setPermissions] = useState<any[]>([]);
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>(
    []
  );

  useEffect(() => {
    if (open) {
      startTransition(async () => {
        const { data } = await getPermissionsAction();
        if (data) {
          setPermissions(data);
          // Đặt các quyền hiện được gán
          const current = data
            .filter((p: any) => currentPermissions.includes(p.name))
            .map((p: any) => p.id);
          setSelectedPermissionIds(current);
        }
      });
    }
  }, [open, currentPermissions]);

  const handleSubmit = () => {
    startTransition(async () => {
      const result = await assignPermissionsAction(
        roleId,
        selectedPermissionIds
      );
      if (result.success) {
        toast({
          title: "Success",
          description: "Permissions assigned successfully",
        });
        onOpenChange(false);
      } else {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive",
        });
      }
    });
  };

  const togglePermission = (permissionId: string) => {
    setSelectedPermissionIds((prev) =>
      prev.includes(permissionId)
        ? prev.filter((id) => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-6xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Assign Permissions to {roleName}</DialogTitle>
          <DialogDescription>
            Check the boxes below to grant permissions to this role. Users with
            this role will have access to these features.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {isPending ? (
            <div className="text-center py-8 text-gray-500">
              Loading permissions...
            </div>
          ) : permissions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No permissions available
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-sm text-gray-600 flex justify-between items-center">
                <span>
                  {selectedPermissionIds.length} of {permissions.length}{" "}
                  permissions selected
                </span>
                {selectedPermissionIds.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedPermissionIds([])}
                    className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    Clear all
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                {(
                  Object.entries(
                    permissions.reduce((acc: any, perm: any) => {
                      const [resource] = perm.name.split(":");
                      const key =
                        resource.charAt(0).toUpperCase() + resource.slice(1);
                      if (!acc[key]) acc[key] = [];
                      acc[key].push(perm);
                      return acc;
                    }, {})
                  ) as [string, any[]][]
                ).map(([resource, groupPerms]) => {
                  const allSelected = groupPerms.every((p) =>
                    selectedPermissionIds.includes(p.id)
                  );
                  const someSelected = groupPerms.some((p) =>
                    selectedPermissionIds.includes(p.id)
                  );

                  return (
                    <div
                      key={resource}
                      className="border rounded-lg p-4 space-y-3 bg-white h-fit"
                    >
                      <div className="flex items-center justify-between pb-2 border-b">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id={`group-${resource}`}
                            checked={allSelected}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                const newIds = new Set(selectedPermissionIds);
                                groupPerms.forEach((p) => newIds.add(p.id));
                                setSelectedPermissionIds(Array.from(newIds));
                              } else {
                                const groupIds = groupPerms.map((p) => p.id);
                                setSelectedPermissionIds(
                                  selectedPermissionIds.filter(
                                    (id) => !groupIds.includes(id)
                                  )
                                );
                              }
                            }}
                          />
                          <Label
                            htmlFor={`group-${resource}`}
                            className="font-bold text-base cursor-pointer"
                          >
                            {resource}
                          </Label>
                        </div>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                          {
                            groupPerms.filter((p) =>
                              selectedPermissionIds.includes(p.id)
                            ).length
                          }{" "}
                          / {groupPerms.length}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 gap-2">
                        {groupPerms.map((permission) => (
                          <div
                            key={permission.id}
                            className="flex items-start space-x-3 p-2 rounded hover:bg-gray-50 transition-colors"
                          >
                            <Checkbox
                              id={permission.id}
                              checked={selectedPermissionIds.includes(
                                permission.id
                              )}
                              onCheckedChange={() =>
                                togglePermission(permission.id)
                              }
                            />
                            <Label
                              htmlFor={permission.id}
                              className="text-sm font-medium cursor-pointer flex-1 leading-none pt-0.5"
                            >
                              {permission.name}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
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
