"use client";

import { CreatePermissionDialog } from "@/components/create-permission-dialog";
import { DeletePermissionDialog } from "@/components/delete-permission-dialog";
import { EditPermissionDialog } from "@/components/edit-permission-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Edit2, Plus, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

export function PermissionsPageClient({ permissions }: { permissions: any[] }) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedPermission, setSelectedPermission] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");

  const openEdit = (permission: any) => {
    setSelectedPermission(permission);
    setEditDialogOpen(true);
  };

  const openDelete = (permission: any) => {
    setSelectedPermission(permission);
    setDeleteDialogOpen(true);
  };

  // Nhóm quyền theo tài nguyên (ví dụ: "user:read" -> tài nguyên "user")
  const groupedPermissions = useMemo(() => {
    const groups: Record<string, any[]> = {};
    
    permissions.forEach((perm) => {
      // Thử tách bằng dấu hai chấm hoặc gạch dưới, mặc định là "Other"
      let resource = "Other";
      if (perm.name.includes(":")) {
        resource = perm.name.split(":")[0];
      } else if (perm.name.includes("_")) {
        resource = perm.name.split("_")[0];
      } else {
        resource = perm.name; // Dự phòng nếu không có dấu phân cách
      }
      
      // Viết hoa chữ cái đầu
      resource = resource.charAt(0).toUpperCase() + resource.slice(1);

      if (!groups[resource]) {
        groups[resource] = [];
      }
      groups[resource].push(perm);
    });

    return groups;
  }, [permissions]);

  // Lọc nhóm dựa trên tìm kiếm
  const filteredGroups = useMemo(() => {
    if (!searchTerm) return groupedPermissions;

    const lowerSearch = searchTerm.toLowerCase();
    const filtered: Record<string, any[]> = {};

    Object.entries(groupedPermissions).forEach(([resource, perms]) => {
      // Kiểm tra xem tên tài nguyên có khớp không
      if (resource.toLowerCase().includes(lowerSearch)) {
        filtered[resource] = perms;
      } else {
        // Kiểm tra xem bất kỳ quyền nào trong nhóm có khớp không
        const matchingPerms = perms.filter((p) =>
          p.name.toLowerCase().includes(lowerSearch)
        );
        if (matchingPerms.length > 0) {
          filtered[resource] = matchingPerms;
        }
      }
    });

    return filtered;
  }, [groupedPermissions, searchTerm]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Permissions Management</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage system permissions grouped by resource
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Create Permission
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search permissions or resources..."
          className="pl-10 max-w-md"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(filteredGroups).length > 0 ? (
          Object.entries(filteredGroups).map(([resource, perms]) => (
            <Card key={resource} className="flex flex-col shadow-sm hover:shadow-md transition-shadow duration-200 border-gray-100">
              <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-lg font-bold text-gray-800">
                  {resource}
                </CardTitle>
                <Badge variant="secondary" className="rounded-full px-2.5 py-0.5 bg-gray-100 text-gray-600 font-medium">
                  {perms.length}
                </Badge>
              </CardHeader>
              <CardContent className="flex-grow pt-0">
                <div className="flex flex-wrap gap-2.5">
                  {perms.map((perm) => (
                    <div
                      key={perm.id}
                      className="group relative inline-flex items-center"
                    >
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-200 bg-white text-sm text-gray-600 hover:border-gray-300 transition-colors">
                        <span className="font-medium">{perm.name}</span>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 -mr-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openEdit(perm);
                            }}
                            className="p-1 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-full transition-colors"
                            title="Edit"
                          >
                            <Edit2 className="h-3 w-3" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openDelete(perm);
                            }}
                            className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-full transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center py-16 text-gray-500 bg-white rounded-lg border border-dashed border-gray-200">
            <Search className="h-10 w-10 text-gray-300 mb-3" />
            <p className="text-lg font-medium">No permissions found</p>
            <p className="text-sm text-gray-400">Try adjusting your search terms</p>
          </div>
        )}
      </div>

      <CreatePermissionDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />

      {selectedPermission && (
        <>
          <EditPermissionDialog
            permissionId={selectedPermission.id}
            currentName={selectedPermission.name}
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
          />
          <DeletePermissionDialog
            permissionId={selectedPermission.id}
            permissionName={selectedPermission.name}
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
          />
        </>
      )}
    </div>
  );
}
