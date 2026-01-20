"use client";

/**
 * =====================================================================
 * SKUS CLIENT - Quản lý biến thể sản phẩm (Enhanced)
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * - Server-side counts for accurate stats
 * - Filter tabs (Active/Inactive), Low Stock filter checkbox
 * - DataTablePagination with page numbers *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Granular Variant Control: Cho phép quản lý chi tiết từng biến thể sản phẩm (SKU) về giá cả và trạng thái hoạt động, hỗ trợ các chiến dịch kinh doanh linh hoạt cho từng mẫu mã cụ thể.
 * - Proactive Stock Replenishment: Cung cấp bộ lọc "Low Stock" thông minh để Admin nhanh chóng nhận diện các mặt hàng sắp hết, giúp tối ưu hóa kế hoạch nhập hàng và tránh gián đoạn chuỗi cung ứng.

 * =====================================================================
 */

import { DataTablePagination } from "@/components/shared/data-table-pagination";
import { StatusBadge } from "@/components/shared/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AdminEmptyState,
  AdminPageHeader,
  AdminTableWrapper,
} from "@/features/admin/components/ui/admin-page-components";
import { AdminSearchInput } from "@/features/admin/components/ui/admin-search-input";
import { EditSkuDialog } from "@/features/admin/components/products/edit-sku-dialog";
import { useAuth } from "@/features/auth/providers/auth-provider";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { formatCurrency } from "@/lib/utils";
import { Sku } from "@/types/models";
import { AlertTriangle, Barcode, Edit, Package, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

type StatusFilterType = "ALL" | "ACTIVE" | "INACTIVE";

export function SkusClient({
  skus,
  total,
  page,
  limit,
  counts,
}: {
  skus: Sku[];
  total: number;
  page: number;
  limit: number;
  counts?: {
    total: number;
    active: number;
    inactive: number;
    lowStock: number;
  };
}) {
  const t = useTranslations("admin");
  const { hasPermission } = useAuth();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedSku, setSelectedSku] = useState<Sku | null>(null);
  const [isPending, startTransition] = useTransition();

  const canUpdate = hasPermission("sku:update");

  const router = useRouter();
  const searchParams = useSearchParams();

  const currentStatus = (searchParams.get("status") ||
    "ALL") as StatusFilterType;
  const hasLowStockFilter = !!searchParams.get("stockLimit");
  const [searchTerm, setSearchTerm] = useState(
    searchParams.get("search") || ""
  );
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Stats from server props
  const totalCount = counts?.total || total;
  const activeCount = counts?.active || 0;
  const inactiveCount = counts?.inactive || 0;
  const lowStockCount = counts?.lowStock || 0;

  // Update URL when search term changes
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    const currentSearch = params.get("search") || "";

    if (currentSearch !== debouncedSearchTerm) {
      startTransition(() => {
        if (debouncedSearchTerm) {
          params.set("search", debouncedSearchTerm);
        } else {
          params.delete("search");
        }
        params.set("page", "1");
        router.push(`/admin/skus?${params.toString()}`);
      });
    }
  }, [debouncedSearchTerm, router, searchParams]);

  const handleStatusChange = (status: StatusFilterType) => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (status === "ALL") {
        params.delete("status");
      } else {
        params.set("status", status);
      }
      params.set("page", "1");
      router.push(`/admin/skus?${params.toString()}`);
    });
  };

  const handleLowStockChange = (checked: boolean) => {
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (checked) {
        params.set("stockLimit", "10");
      } else {
        params.delete("stockLimit");
      }
      params.set("page", "1");
      router.push(`/admin/skus?${params.toString()}`);
    });
  };

  const openEdit = (sku: Sku) => {
    setSelectedSku(sku);
    setEditDialogOpen(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Page Header */}
      <AdminPageHeader
        title={t("skus.management")}
        subtitle={t("skus.showingCount", {
          count: skus.length,
          total: totalCount,
        })}
        icon={<Barcode className="text-cyan-500 fill-cyan-500/10" />}
        variant="cyan"
        stats={[
          { label: "total", value: totalCount, variant: "slate" },
          { label: "active", value: activeCount, variant: "emerald" },
          { label: "inactive", value: inactiveCount, variant: "cyan" },
          { label: "lowStock", value: lowStockCount, variant: "danger" },
        ]}
      />
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <Tabs
          value={currentStatus}
          onValueChange={(v) => handleStatusChange(v as StatusFilterType)}
          className="w-full"
        >
          <TabsList className="bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl h-14 border-none shadow-inner flex-wrap w-fit">
            <TabsTrigger
              value="ALL"
              className="rounded-xl px-4 h-12 font-black uppercase tracking-widest text-xs data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-lg data-[state=active]:text-primary transition-all gap-2"
              disabled={isPending}
            >
              <Package className="h-4 w-4" />
              All
              <Badge
                variant="outline"
                className="ml-1 h-5 px-1.5 bg-slate-200 dark:bg-slate-700 text-[10px] font-black"
              >
                {totalCount}
              </Badge>
            </TabsTrigger>
            <TabsTrigger
              value="ACTIVE"
              className="rounded-xl px-4 h-12 font-black uppercase tracking-widest text-xs data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-lg data-[state=active]:text-emerald-600 transition-all gap-2"
              disabled={isPending}
            >
              <div className="h-2 w-2 rounded-full bg-emerald-500" />
              Active
              <Badge
                variant="outline"
                className="ml-1 h-5 px-1.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 text-[10px] font-black"
              >
                {activeCount}
              </Badge>
            </TabsTrigger>
            <TabsTrigger
              value="INACTIVE"
              className="rounded-xl px-4 h-12 font-black uppercase tracking-widest text-xs data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-lg data-[state=active]:text-slate-600 transition-all gap-2"
              disabled={isPending}
            >
              <div className="h-2 w-2 rounded-full bg-slate-400" />
              Inactive
              <Badge
                variant="outline"
                className="ml-1 h-5 px-1.5 bg-slate-100 dark:bg-slate-900/40 text-slate-600 text-[10px] font-black"
              >
                {inactiveCount}
              </Badge>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex flex-col md:flex-row items-center gap-4">
          {/* Low Stock Filter */}
          <div className="flex items-center space-x-2 bg-white dark:bg-slate-900 px-4 h-12 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm">
            <Checkbox
              id="low-stock"
              checked={hasLowStockFilter}
              onCheckedChange={(checked) =>
                handleLowStockChange(checked as boolean)
              }
              disabled={isPending}
              className="rounded-md"
            />
            <Label
              htmlFor="low-stock"
              className="cursor-pointer whitespace-nowrap text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2"
            >
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Low Stock
              <Badge
                variant="outline"
                className="ml-1 h-5 px-1.5 bg-rose-100 dark:bg-rose-900/40 text-rose-600 text-[10px] font-black border-rose-200"
              >
                {lowStockCount}
              </Badge>
            </Label>
          </div>

          {/* Search */}
          <div className="w-full md:w-80">
            <AdminSearchInput
              placeholder={t("skus.searchPlaceholder")}
              value={searchTerm}
              onChange={setSearchTerm}
              isLoading={isPending}
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <AdminTableWrapper isLoading={isPending} variant="cyan">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[200px]">
                <div className="flex items-center gap-2">
                  <Barcode className="h-4 w-4" />
                  {t("skus.skuCodeLabel")}
                </div>
              </TableHead>
              <TableHead>{t("product")}</TableHead>
              <TableHead>{t("skus.priceLabel")}</TableHead>
              <TableHead>
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  {t("skus.stockLabel")}
                </div>
              </TableHead>
              <TableHead>{t("status")}</TableHead>
              {canUpdate && (
                <TableHead className="text-right w-[100px]">
                  {t("actions")}
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {skus.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canUpdate ? 6 : 5}>
                  <AdminEmptyState
                    icon={Barcode}
                    title={t("skus.noFound")}
                    description="No SKUs found matching your criteria."
                  />
                </TableCell>
              </TableRow>
            ) : (
              skus.map((sku: Sku) => (
                <TableRow
                  key={sku.id}
                  className={`hover:bg-muted/30 transition-colors ${
                    sku.status === "INACTIVE" ? "opacity-60" : ""
                  }`}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Barcode className="h-5 w-5" />
                      </div>
                      <code className="font-mono text-sm font-medium">
                        {sku.skuCode}
                      </code>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {(sku as any).product?.name || "N/A"}
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(Number(sku.price) || 0)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span
                        className={
                          sku.stock < 10 ? "text-amber-600 font-medium" : ""
                        }
                      >
                        {sku.stock}
                      </span>
                      {sku.stock < 10 && (
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge
                      status={sku.status}
                      label={
                        sku.status === "ACTIVE" ? t("active") : t("inactive")
                      }
                    />
                  </TableCell>
                  {canUpdate && (
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-blue-500 hover:text-blue-600 hover:bg-blue-50"
                        onClick={() => openEdit(sku)}
                        disabled={sku.status === "INACTIVE"}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </AdminTableWrapper>
      {/* Pagination with page numbers - only show when needed */}
      {skus.length > 0 && total > limit && (
        <DataTablePagination page={page} total={total} limit={limit} />
      )}
      {selectedSku && (
        <EditSkuDialog
          key={selectedSku.id}
          sku={selectedSku}
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
        />
      )}
    </div>
  );
}
