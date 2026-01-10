"use client";

/**
 * =====================================================================
 * ADMIN PERMISSIONS CLIENT - Quản lý quyền hạn (Enhanced)
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * IMPROVED UI:
 * - Collapsible accordion-style groups
 * - Grid layout for better visibility
 * - Color-coded action badges
 * - Search with instant filter
 * - Stats in header
 * =====================================================================
 */

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { deletePermissionAction } from "@/features/admin/actions";
import {
  AdminEmptyState,
  AdminPageHeader,
} from "@/features/admin/components/ui/admin-page-components";
import { CreatePermissionDialog } from "@/features/admin/components/dialogs/create-permission-dialog";
import { DeleteConfirmDialog } from "@/features/admin/components/dialogs/delete-confirm-dialog";
import { EditPermissionDialog } from "@/features/admin/components/dialogs/edit-permission-dialog";
import { useAuth } from "@/features/auth/providers/auth-provider";
import { cn } from "@/lib/utils";
import { Permission } from "@/types/models";
import {
  ChevronDown,
  ChevronRight,
  Edit2,
  Eye,
  FileEdit,
  Key,
  Lock,
  Plus,
  Search,
  Settings,
  Shield,
  Trash2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

// Action icons mapping
const actionIcons: Record<string, React.ReactNode> = {
  create: <Plus className="h-3 w-3" />,
  read: <Eye className="h-3 w-3" />,
  update: <FileEdit className="h-3 w-3" />,
  delete: <Trash2 className="h-3 w-3" />,
  manage: <Settings className="h-3 w-3" />,
};

// Action colors
const actionColors: Record<string, string> = {
  create:
    "bg-emerald-500/10 text-emerald-600 border-emerald-500/20 hover:bg-emerald-500/20",
  read: "bg-blue-500/10 text-blue-600 border-blue-500/20 hover:bg-blue-500/20",
  update:
    "bg-amber-500/10 text-amber-600 border-amber-500/20 hover:bg-amber-500/20",
  delete: "bg-red-500/10 text-red-600 border-red-500/20 hover:bg-red-500/20",
  manage:
    "bg-purple-500/10 text-purple-600 border-purple-500/20 hover:bg-purple-500/20",
};

export function PermissionsPageClient({
  permissions,
}: {
  permissions: Permission[];
}) {
  const t = useTranslations("admin");
  const { hasPermission } = useAuth();
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedPermission, setSelectedPermission] =
    useState<Permission | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const canCreate = hasPermission("permission:create");
  const canUpdate = hasPermission("permission:update");
  const canDelete = hasPermission("permission:delete");

  const openEdit = (permission: Permission) => {
    setSelectedPermission(permission);
    setEditDialogOpen(true);
  };

  const openDelete = (permission: Permission) => {
    setSelectedPermission(permission);
    setDeleteDialogOpen(true);
  };

  const toggleGroup = (resource: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(resource)) {
      newExpanded.delete(resource);
    } else {
      newExpanded.add(resource);
    }
    setExpandedGroups(newExpanded);
  };

  const expandAll = () => {
    setExpandedGroups(new Set(Object.keys(groupedPermissions)));
  };

  const collapseAll = () => {
    setExpandedGroups(new Set());
  };

  // Group permissions by resource
  const groupedPermissions = (() => {
    const groups: Record<string, Permission[]> = {};

    permissions.forEach((perm) => {
      let resource = "Other";
      if (perm.name.includes(":")) {
        resource = perm.name.split(":")[0];
      } else if (perm.name.includes("_")) {
        resource = perm.name.split("_")[0];
      } else {
        resource = perm.name;
      }

      resource = resource.charAt(0).toUpperCase() + resource.slice(1);

      if (!groups[resource]) {
        groups[resource] = [];
      }
      groups[resource].push(perm);
    });

    // Sort groups by name
    return Object.fromEntries(
      Object.entries(groups).sort(([a], [b]) => a.localeCompare(b))
    );
  })();

  // Filter groups based on search
  const filteredGroups = (() => {
    if (!searchTerm) return groupedPermissions;

    const lowerSearch = searchTerm.toLowerCase();
    const filtered: Record<string, Permission[]> = {};

    Object.entries(groupedPermissions).forEach(([resource, perms]) => {
      if (resource.toLowerCase().includes(lowerSearch)) {
        filtered[resource] = perms;
      } else {
        const matchingPerms = perms.filter((p) =>
          p.name.toLowerCase().includes(lowerSearch)
        );
        if (matchingPerms.length > 0) {
          filtered[resource] = matchingPerms;
        }
      }
    });

    return filtered;
  })();

  // Extract action from permission name
  const getAction = (permName: string) => {
    const parts = permName.split(":").pop()?.split("_").pop() || "";
    return parts.toLowerCase();
  };

  // Stats
  const totalGroups = Object.keys(groupedPermissions).length;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <AdminPageHeader
        title={t("permissions.management")}
        subtitle={t("permissions.description")}
        icon={<Shield className="h-5 w-5" />}
        stats={[
          { label: "total", value: permissions.length, variant: "default" },
          { label: "resources", value: totalGroups, variant: "info" },
        ]}
        actions={
          canCreate ? (
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {t("permissions.createNew")}
            </Button>
          ) : undefined
        }
      />

      {/* Search & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t("permissions.searchPlaceholder")}
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={expandAll}>
            Expand All
          </Button>
          <Button variant="outline" size="sm" onClick={collapseAll}>
            Collapse All
          </Button>
        </div>
      </div>

      {/* Permission Groups */}
      {Object.entries(filteredGroups).length > 0 ? (
        <div className="grid gap-4">
          {Object.entries(filteredGroups).map(([resource, perms]) => {
            const isExpanded = expandedGroups.has(resource);
            return (
              <div
                key={resource}
                className="rounded-xl border border-border bg-card overflow-hidden"
              >
                {/* Group Header */}
                <button
                  onClick={() => toggleGroup(resource)}
                  className={cn(
                    "w-full flex items-center justify-between p-4 transition-colors",
                    "hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/20"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Key className="h-5 w-5" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold text-foreground">
                        {resource}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {perms.length} permission{perms.length > 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {/* Quick badges preview when collapsed */}
                    {!isExpanded && (
                      <div className="hidden sm:flex gap-1">
                        {perms.slice(0, 4).map((perm) => {
                          const action = getAction(perm.name);
                          return (
                            <Badge
                              key={perm.id}
                              variant="outline"
                              className={cn(
                                "text-xs px-2",
                                actionColors[action] || "bg-muted"
                              )}
                            >
                              {action}
                            </Badge>
                          );
                        })}
                        {perms.length > 4 && (
                          <Badge variant="secondary" className="text-xs">
                            +{perms.length - 4}
                          </Badge>
                        )}
                      </div>
                    )}
                    {isExpanded ? (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </button>

                {/* Group Content - Permissions */}
                {isExpanded && (
                  <div className="border-t border-border bg-muted/20 p-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                      {perms.map((perm) => {
                        const action = getAction(perm.name);
                        const icon = actionIcons[action] || (
                          <Lock className="h-3 w-3" />
                        );
                        const colorClass =
                          actionColors[action] ||
                          "bg-muted text-muted-foreground";

                        return (
                          <div
                            key={perm.id}
                            className={cn(
                              "group flex items-center justify-between gap-2 px-4 py-3 rounded-lg border transition-all",
                              colorClass
                            )}
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              {icon}
                              <span className="font-medium text-sm truncate">
                                {perm.name}
                              </span>
                            </div>
                            {(canUpdate || canDelete) && (
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {canUpdate && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openEdit(perm);
                                    }}
                                    className="p-1.5 rounded-full hover:bg-white/50 dark:hover:bg-black/20 transition-colors"
                                    title={t("edit")}
                                  >
                                    <Edit2 className="h-3.5 w-3.5" />
                                  </button>
                                )}
                                {canDelete && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openDelete(perm);
                                    }}
                                    className="p-1.5 rounded-full hover:bg-white/50 dark:hover:bg-black/20 transition-colors"
                                    title={t("delete")}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <AdminEmptyState
          icon={Shield}
          title={t("permissions.noFound")}
          description={t("permissions.adjustSearch")}
          action={
            canCreate ? (
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Permission
              </Button>
            ) : undefined
          }
        />
      )}

      {/* Dialogs */}
      <CreatePermissionDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />

      {selectedPermission && (
        <>
          <EditPermissionDialog
            key={selectedPermission.id}
            permissionId={selectedPermission.id}
            currentName={selectedPermission.name}
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
          />
          <DeleteConfirmDialog
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
            title={t("confirmTitle")}
            description={t("confirmDeleteDesc", {
              item: selectedPermission.name,
            })}
            action={() => deletePermissionAction(selectedPermission.id)}
            successMessage={t("permissions.successDelete")}
          />
        </>
      )}
    </div>
  );
}
