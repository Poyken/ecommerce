"use client";

import { FormDialog } from "@/components/shared/form-dialog";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  assignPermissionsAction,
  getPermissionsAction,
} from "@/features/admin/actions";
import { Permission } from "@/types/models";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState, useTransition } from "react";



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
  const t = useTranslations("admin");
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>(
    []
  );

  useEffect(() => {
    if (open) {
      startTransition(async () => {
        const result = await getPermissionsAction();
        if ("error" in result || !result.data) return;
        const data = result.data;
        setPermissions(data);
        // Đặt các quyền hiện được gán
        const current = data
          .filter((p: Permission) => currentPermissions.includes(p.name))
          .map((p: Permission) => p.id);
        setSelectedPermissionIds(current);
      });
    }
  }, [open, currentPermissions]);

  const isDirty = useMemo(() => {
    // If we haven't loaded permissions yet, we can't accurately check dirty status
    if (permissions.length === 0) return false;

    const originalIds = permissions
      .filter((p: Permission) => currentPermissions.includes(p.name))
      .map((p: Permission) => p.id)
      .sort();

    const currentIds = [...selectedPermissionIds].sort();

    return JSON.stringify(originalIds) !== JSON.stringify(currentIds);
  }, [selectedPermissionIds, permissions, currentPermissions]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    startTransition(async () => {
      const result = await assignPermissionsAction(
        roleId,
        selectedPermissionIds
      );
      if (result.success) {
        toast({
          variant: "success",
          title: t("success"),
          description: t("permissions.successAssign"),
        });
        onOpenChange(false);
      } else {
        toast({
          title: t("error"),
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

  // Group permissions logic
  const groupedPermissions = permissions.reduce(
    (acc: Record<string, Permission[]>, perm: Permission) => {
      const [resource] = perm.name.split(":");
      const key = resource.charAt(0).toUpperCase() + resource.slice(1);
      if (!acc[key]) acc[key] = [];
      acc[key].push(perm);
      return acc;
    },
    {}
  );

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("permissions.assignToRole", { name: roleName })}
      description={t("permissions.description")}
      onSubmit={handleSubmit}
      isPending={isPending}
      submitLabel={t("save")}
      maxWidth="!max-w-6xl"
      disabled={isPending || !isDirty}
    >
      <div className="space-y-4 py-4 pr-1">
        {isPending && permissions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {t("permissions.loading")}
          </div>
        ) : permissions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {t("permissions.noFound")}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-sm text-gray-600 flex justify-between items-center">
              <span>
                {t("permissions.selectedCount", {
                  count: selectedPermissionIds.length,
                  total: permissions.length,
                })}
              </span>
              {selectedPermissionIds.length > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedPermissionIds([])}
                  className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                  disabled={isPending}
                >
                  {t("permissions.clearAll")}
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-6">
              {Object.entries(groupedPermissions).map(
                ([resource, groupPerms]) => {
                  const allSelected = groupPerms.every((p) =>
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
                            disabled={isPending}
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
                              disabled={isPending}
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
                }
              )}
            </div>
          </div>
        )}
      </div>
    </FormDialog>
  );
}
