"use client";

import { DataTablePagination } from "@/components/shared/data-table-pagination";
import { useToast } from "@/components/shared/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { deleteTenantAction } from "@/features/admin/actions";
import {
  AdminEmptyState,
  AdminPageHeader,
  AdminTableWrapper,
} from "@/features/admin/components/admin-page-components";
import { DeleteConfirmDialog } from "@/features/admin/components/delete-confirm-dialog";
import { TenantDialog } from "@/features/admin/components/tenant-dialog";
import { useAuth } from "@/features/auth/providers/auth-provider";
import { useAdminTable } from "@/lib/hooks/use-admin-table";
import { Tenant } from "@/types/models";
import { format } from "date-fns";
import {
  Edit,
  ExternalLink,
  Eye,
  Globe,
  Plus,
  Search,
  Store,
  Trash2
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

export function TenantsClient({
  tenants,
  total,
  page,
  limit,
}: {
  tenants: Tenant[];
  total: number;
  page: number;
  limit: number;
}) {
  const t = useTranslations("admin");
  const { toast } = useToast();
  const { hasPermission } = useAuth();
  const [tenantDialogOpen, setTenantDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit" | "view">("create");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);

  // Super Admin permissions usually imply all, but explicit check is good
  const canCreate = hasPermission("tenant:create"); 
  const canUpdate = hasPermission("tenant:update");
  const canDelete = hasPermission("tenant:delete");

  const { searchTerm, setSearchTerm, isPending } =
    useAdminTable("/super-admin/tenants");

  const openDelete = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setDeleteDialogOpen(true);
  };

  const openEdit = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setDialogMode("edit");
    setTenantDialogOpen(true);
  };

  const openView = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setDialogMode("view");
    setTenantDialogOpen(true);
  };

  const openCreate = () => {
    setSelectedTenant(null);
    setDialogMode("create");
    setTenantDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Tenants Management"
        subtitle={`Manages ${total} stores on the platform`}
        icon={<Store className="h-5 w-5" />}
        stats={[
          { label: "Total Stores", value: total, variant: "default" },
          { label: "Active", value: tenants.length, variant: "success" }, // Placeholder logic
        ]}
        actions={
          <div className="flex items-center gap-2">
            {canCreate && (
                <Button onClick={openCreate}>
                  <Plus className="mr-2 h-4 w-4" />
                  Launch New Store
                </Button>
            )}
          </div>
        }
      />

      {/* Search */}
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search stores..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <AdminTableWrapper isLoading={isPending}>
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead>Store Name</TableHead>
              <TableHead>Domain</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tenants.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5}>
                  <AdminEmptyState
                    icon={Store}
                    title="No stores found"
                    description="Get started by launching a new niche store."
                    action={
                      canCreate ? (
                        <Button onClick={openCreate}>
                          <Plus className="mr-2 h-4 w-4" />
                          Launch Store
                        </Button>
                      ) : undefined
                    }
                  />
                </TableCell>
              </TableRow>
            ) : (
              tenants.map((tenant) => (
                <TableRow key={tenant.id}>
                  <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                          <div 
                            className="w-8 h-8 rounded border border-border flex items-center justify-center"
                            style={{ backgroundColor: tenant.themeConfig?.primaryColor || '#000' }}
                          >
                              <span className="text-xs text-white font-bold">{(tenant.name || 'Tenant').substring(0, 2).toUpperCase()}</span>
                          </div>
                          {tenant.name}
                      </div>
                  </TableCell>
                  <TableCell>
                      <a href={`http://${tenant.domain}:3000`} target="_blank" className="flex items-center gap-1 hover:underline text-blue-600">
                          <Globe className="h-3 w-3" />
                          {tenant.domain}
                          <ExternalLink className="h-3 w-3" />
                      </a>
                  </TableCell>
                  <TableCell>
                      <Badge variant={tenant.plan === 'ENTERPRISE' ? 'default' : 'secondary'}>
                          {tenant.plan}
                      </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(tenant.createdAt), "dd MMM yyyy")}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openView(tenant)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      {canUpdate && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEdit(tenant)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      {canDelete && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-600"
                          onClick={() => openDelete(tenant)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </AdminTableWrapper>

      {total > limit && (
        <DataTablePagination page={page} total={total} limit={limit} />
      )}

      <TenantDialog
        open={tenantDialogOpen}
        onOpenChange={setTenantDialogOpen}
        tenant={selectedTenant}
        mode={dialogMode}
      />

      {selectedTenant && (
          <DeleteConfirmDialog
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
            title="Delete Store"
            description={`Are you sure you want to delete "${selectedTenant.name}"? This action cannot be undone.`}
            action={() => deleteTenantAction(selectedTenant.id)}
            successMessage="Store deleted successfully"
          />
      )}
    </div>
  );
}
