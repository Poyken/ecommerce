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
  Package,
  Plus,
  Search,
  ShoppingCart,
  Store,
  Trash2,
  Users,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

/**
 * =================================================================================================
 * TENANTS CLIENT - QUẢN LÝ DANH SÁCH CHI NHÁNH (STORE)
 * =================================================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. SUPER ADMIN CAPABILITIES:
 *    - Đây là màn hình dành riêng cho Super Admin để quản lý toàn bộ hệ thống SaaS.
 *    - Nó liệt kê tất cả các Store (Tenants) đang hoạt động trên nền tảng.
 *
 * 2. PERMISSION-BASED ACTIONS:
 *    - `hasPermission` kiểm tra quyền hạn cụ thể (create, update, delete) trước khi hiện nút bấm.
 *    - `useAdminTable`: Hook dùng chung để xử lý Tìm kiếm, Phân trang và Loading state.
 *
 * 3. MULTI-TENANCY LAUNCHING:
 *    - `Launch New Store`: Khi tạo Tenant mới, hệ thống sẽ tự động cấp phát Database schema
 *      và khởi tạo cấu hình mặc định cho Store đó.
 * =================================================================================================
 */
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
  const t = useTranslations("superAdmin.tenants");
  const { toast } = useToast();
  const { hasPermission } = useAuth();
  const [tenantDialogOpen, setTenantDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit" | "view">(
    "create"
  );
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);

  // Super Admin permissions usually imply all, but explicit check is good
  const canCreate = hasPermission("tenant:create");
  const canUpdate = hasPermission("tenant:update");
  const canDelete = hasPermission("tenant:delete");

  const { searchTerm, setSearchTerm, isPending } = useAdminTable(
    "/super-admin/tenants"
  );

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
        title={t("title")}
        subtitle={t("subtitle", { total })}
        icon={<Store className="h-5 w-5" />}
        stats={[
          { label: t("totalStores"), value: total, variant: "default" },
          { label: t("active"), value: tenants.length, variant: "success" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            {canCreate && (
              <Button onClick={openCreate}>
                <Plus className="mr-2 h-4 w-4" />
                {t("launchNew")}
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
            placeholder={t("searchPlaceholder")}
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
              <TableHead>{t("table.name")}</TableHead>
              <TableHead>{t("table.domain")}</TableHead>
              <TableHead>{t("table.plan")}</TableHead>
              <TableHead className="text-center">
                {t("dialog.metrics.customers")}
              </TableHead>
              <TableHead className="text-center">
                {t("dialog.metrics.products")}
              </TableHead>
              <TableHead className="text-center">
                {t("dialog.metrics.orders")}
              </TableHead>
              <TableHead>{t("table.createdAt")}</TableHead>
              <TableHead className="text-right">{t("table.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tenants.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8}>
                  <AdminEmptyState
                    icon={Store}
                    title={t("empty.title")}
                    description={t("empty.description")}
                    action={
                      canCreate ? (
                        <Button onClick={openCreate}>
                          <Plus className="mr-2 h-4 w-4" />
                          {t("empty.action")}
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
                        style={{
                          backgroundColor:
                            tenant.themeConfig?.primaryColor || "#000",
                        }}
                      >
                        <span className="text-xs text-white font-bold">
                          {(tenant.name || "Tenant")
                            .substring(0, 2)
                            .toUpperCase()}
                        </span>
                      </div>
                      {tenant.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    <a
                      href={`http://${tenant.domain}:3000`}
                      target="_blank"
                      className="flex items-center gap-1 hover:underline text-blue-600"
                    >
                      <Globe className="h-3 w-3" />
                      {tenant.domain}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        tenant.plan === "ENTERPRISE" ? "default" : "secondary"
                      }
                    >
                      {tenant.plan}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1 font-bold">
                      <Users className="h-3 w-3 text-muted-foreground" />
                      {tenant._count?.users || 0}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1 font-bold">
                      <Package className="h-3 w-3 text-muted-foreground" />
                      {tenant._count?.products || 0}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1 font-bold">
                      <ShoppingCart className="h-3 w-3 text-muted-foreground" />
                      {tenant._count?.orders || 0}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(tenant.createdAt), "dd/MM/yyyy")}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openView(tenant)}
                      >
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
          title={t("deleteDialog.title") || "Delete Store"}
          description={
            t("deleteDialog.description", { name: selectedTenant.name }) ||
            `Are you sure you want to delete "${selectedTenant.name}"? This action cannot be undone.`
          }
          action={() => deleteTenantAction(selectedTenant.id)}
          successMessage={
            t("messages.deleteSuccess") || "Store deleted successfully"
          }
        />
      )}
    </div>
  );
}
