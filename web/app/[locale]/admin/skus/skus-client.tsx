"use client";

import { EditSkuDialog } from "@/components/organisms/admin/edit-sku-dialog";
import { SearchInput } from "@/components/molecules/search-input";
import { Button } from "@/components/atoms/button";
import { GlassCard } from "@/components/atoms/glass-card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/atoms/select";
import { StatusBadge } from "@/components/atoms/status-badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/atoms/table";
import { formatCurrency } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";
import { Sku } from "@/types/models";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

/**
 * =====================================================================
 * ADMIN SKUS CLIENT - Giao diện quản lý biến thể sản phẩm
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. SKU DATA VISUALIZATION:
 * - Hiển thị chi tiết từng biến thể bao gồm: Mã SKU, Tên sản phẩm, Giá (VND) và Số lượng tồn kho.
 * - `font-mono`: Dùng cho mã SKU để dễ đọc và phân biệt các ký tự tương tự nhau.
 *
 * 2. STATUS-BASED UI:
 * - `opacity-60`: Làm mờ các SKU đang ở trạng thái `INACTIVE` để admin dễ dàng nhận biết.
 * - Badge màu xanh cho `ACTIVE` và màu xám cho các trạng thái khác.
 *
 * 3. DYNAMIC SEARCH & FILTER:
 * - Kết hợp `SearchInput` và `Select` filter để tìm kiếm nhanh SKU.
 * - Mọi thay đổi đều được đẩy lên URL (`router.push`) để giữ trạng thái đồng bộ.
 * =====================================================================
 */

export function SkusClient({
  skus,
  total,
  page,
  limit,
}: {
  skus: Sku[];
  total: number;
  page: number;
  limit: number;
}) {
  const t = useTranslations("admin");
  const { hasPermission } = useAuth();
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedSku, setSelectedSku] = useState<Sku | null>(null);

  const canUpdate = hasPermission("sku:update");

  const router = useRouter();
  const searchParams = useSearchParams();

  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  const goToPage = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`/admin/skus?${params.toString()}`);
  };

  const openEdit = (sku: Sku) => {
    setSelectedSku(sku);
    setEditDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{t("skus.management")}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {t("skus.showingCount", { count: skus.length, total: total })}
          </p>
        </div>
        <div className="flex gap-2">
          <SearchInput
            placeholder={t("skus.searchPlaceholder")}
            className="w-[300px] bg-white border-input text-foreground placeholder:text-muted-foreground focus:bg-white transition-colors"
          />
          <Select
            defaultValue={(searchParams.get("status") || "ALL").toUpperCase()}
            onValueChange={(value) => {
              const params = new URLSearchParams(searchParams.toString());
              if (value === "ALL") {
                params.delete("status");
              } else {
                params.set("status", value);
              }
              params.set("page", "1");
              router.push(`/admin/skus?${params.toString()}` as any);
            }}
          >
            <SelectTrigger className="w-[180px] h-10 bg-white border-input">
              <SelectValue placeholder={t("skus.filterStatus")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">{t("skus.allStatus")}</SelectItem>
              <SelectItem value="ACTIVE">{t("skus.activeOnly")}</SelectItem>
              <SelectItem value="INACTIVE">{t("skus.inactiveOnly")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <GlassCard className="p-6">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-foreground">
            {t("skus.allSkus")}
          </h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="border-white/10 hover:bg-white/5">
              <TableHead className="text-muted-foreground uppercase tracking-wider text-xs font-bold">
                {t("skus.skuCodeLabel")}
              </TableHead>
              <TableHead className="text-muted-foreground uppercase tracking-wider text-xs font-bold">
                {t("product")}
              </TableHead>
              <TableHead className="text-muted-foreground uppercase tracking-wider text-xs font-bold">
                {t("skus.priceLabel")}
              </TableHead>
              <TableHead className="text-muted-foreground uppercase tracking-wider text-xs font-bold">
                {t("skus.stockLabel")}
              </TableHead>
              <TableHead className="text-muted-foreground uppercase tracking-wider text-xs font-bold">
                {t("status")}
              </TableHead>
              {canUpdate && (
                <TableHead className="text-right text-muted-foreground uppercase tracking-wider text-xs font-bold">
                  {t("actions")}
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {skus && skus.length > 0 ? (
              skus.map((sku: any) => (
                <TableRow
                  key={sku.id}
                  className={`border-white/10 hover:bg-white/5 transition-colors ${
                    sku.status === "INACTIVE" ? "opacity-60" : ""
                  }`}
                >
                  <TableCell className="font-medium font-mono text-foreground">
                    {sku.skuCode}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {sku.product?.name || "N/A"}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatCurrency(sku.price)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {sku.stock}
                  </TableCell>
                  <TableCell>
<StatusBadge 
                      status={sku.status}
                      label={sku.status === "ACTIVE" ? t("active") : t("inactive")}
                    />
                  </TableCell>
                  {canUpdate && (
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEdit(sku)}
                        disabled={sku.status === "INACTIVE"}
                        className="border-white/10 hover:bg-white/5"
                      >
                        {t("edit")}
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={canUpdate ? 6 : 5}
                  className="text-center py-8 text-muted-foreground"
                >
                  {t("skus.noFound")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/10">
            <div className="text-sm text-muted-foreground">
              {t("pagination.page", { current: page, total: totalPages })}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(page - 1)}
                disabled={!hasPrevPage}
                className="border-white/10 hover:bg-white/5"
              >
                {t("pagination.previous")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(page + 1)}
                disabled={!hasNextPage}
                className="border-white/10 hover:bg-white/5"
              >
                {t("pagination.next")}
              </Button>
            </div>
          </div>
        )}
      </GlassCard>

      {selectedSku && (
        <>
          <EditSkuDialog
            sku={selectedSku}
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
          />
        </>
      )}
    </div>
  );
}
