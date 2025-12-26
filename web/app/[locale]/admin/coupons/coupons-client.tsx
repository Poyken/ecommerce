"use client";

/**
 * =====================================================================
 * COUPONS CLIENT - Quản lý mã giảm giá (Enhanced)
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * - Filter theo status (All/Active/Expired)
 * - Stats hiển thị tổng quan
 * - Quick actions: Copy, Edit, Delete
 * =====================================================================
 */

import { deleteCouponAction } from "@/features/admin/actions";
import { Button } from "@/components/ui/button";
import { DataTablePagination } from "@/components/shared/data-table-pagination";
import { Input } from "@/components/ui/input";
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
  AdminActionBadge,
  AdminEmptyState,
  AdminPageHeader,
  AdminTableWrapper,
} from "@/features/admin/components/admin-page-components";
import { CreateCouponDialog } from "@/features/admin/components/create-coupon-dialog";
import { DeleteConfirmDialog } from "@/features/admin/components/delete-confirm-dialog";
import { EditCouponDialog } from "@/features/admin/components/edit-coupon-dialog";
import { useToast } from "@/components/shared/use-toast";
import { cn, formatCurrency } from "@/lib/utils";
import { useAuth } from "@/features/auth/providers/auth-provider";
import { PaginationMeta } from "@/types/dtos";
import { Coupon } from "@/types/models";
import { format } from "date-fns";
import {
  Calendar,
  Copy,
  Edit,
  Percent,
  Plus,
  Search,
  Tag,
  Ticket,
  Trash2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

interface CouponsClientProps {
  initialCoupons: Coupon[];
  meta?: PaginationMeta;
}

type FilterType = "all" | "active" | "expired";

export function CouponsClient({ initialCoupons, meta }: CouponsClientProps) {
  const t = useTranslations("admin");
  const router = useRouter();
  const searchParams = useSearchParams();
  const { hasPermission } = useAuth();
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [filter, setFilter] = useState<FilterType>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  const canCreate = hasPermission("coupon:create");
  const canUpdate = hasPermission("coupon:update");
  const canDelete = hasPermission("coupon:delete");

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: t("coupons.copied"),
      description: t("coupons.copiedDescription", { code: text }),
    });
  };

  // Check if coupon is expired
  const isExpired = (coupon: Coupon) => {
    return new Date(coupon.endDate) < new Date();
  };

  // Filter coupons
  const filteredCoupons = initialCoupons.filter((coupon) => {
    // Search filter
    if (
      searchTerm &&
      !coupon.code.toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      return false;
    }

    // Status filter
    if (filter === "all") return true;
    if (filter === "active") return coupon.isActive && !isExpired(coupon);
    if (filter === "expired") return isExpired(coupon) || !coupon.isActive;
    return true;
  });

  // Stats
  const activeCount = initialCoupons.filter(
    (c) => c.isActive && !isExpired(c)
  ).length;
  const expiredCount = initialCoupons.filter(
    (c) => isExpired(c) || !c.isActive
  ).length;
  const totalDiscount = initialCoupons.reduce(
    (sum, c) =>
      c.discountType === "PERCENTAGE"
        ? sum
        : sum + Number(c.discountValue) * c.usedCount,
    0
  );

  const page = meta?.page || 1;
  const totalPages = meta ? Math.ceil(meta.total / meta.limit) : 1;

  const goToPage = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`/admin/coupons?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <AdminPageHeader
        title={t("coupons.title")}
        subtitle={t("coupons.subtitle")}
        icon={<Ticket className="h-5 w-5" />}
        stats={[
          { label: "total", value: initialCoupons.length, variant: "default" },
          { label: "active", value: activeCount, variant: "success" },
          { label: "expired", value: expiredCount, variant: "danger" },
        ]}
        actions={
          canCreate ? (
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {t("coupons.createNew")}
            </Button>
          ) : undefined
        }
      />

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <Tabs value={filter} onValueChange={(v) => setFilter(v as FilterType)}>
          <TabsList>
            <TabsTrigger value="all" className="gap-2">
              <Tag className="h-4 w-4" />
              All ({initialCoupons.length})
            </TabsTrigger>
            <TabsTrigger value="active" className="gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Active ({activeCount})
            </TabsTrigger>
            <TabsTrigger value="expired" className="gap-2">
              <span className="h-2 w-2 rounded-full bg-red-500" />
              Expired ({expiredCount})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search coupon code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Table */}
      <AdminTableWrapper>
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-[180px]">
                {t("coupons.codeLabel")}
              </TableHead>
              <TableHead>{t("coupons.typeLabel")}</TableHead>
              <TableHead>{t("coupons.valueLabel")}</TableHead>
              <TableHead>{t("coupons.usage")}</TableHead>
              <TableHead>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {t("coupons.validity")}
                </div>
              </TableHead>
              <TableHead>{t("coupons.status")}</TableHead>
              {(canUpdate || canDelete) && (
                <TableHead className="text-right w-[100px]">
                  {t("actions")}
                </TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCoupons.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canUpdate || canDelete ? 7 : 6}>
                  <AdminEmptyState
                    icon={Ticket}
                    title={t("coupons.noFound")}
                    description="No coupons found matching your criteria."
                    action={
                      canCreate ? (
                        <Button onClick={() => setIsCreateDialogOpen(true)}>
                          <Plus className="mr-2 h-4 w-4" />
                          Create Coupon
                        </Button>
                      ) : undefined
                    }
                  />
                </TableCell>
              </TableRow>
            ) : (
              filteredCoupons.map((coupon) => (
                <TableRow
                  key={coupon.id}
                  className={cn(
                    "hover:bg-muted/30 transition-colors",
                    isExpired(coupon) && "opacity-60"
                  )}
                >
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <code className="bg-primary/10 text-primary px-2.5 py-1 rounded-md text-xs font-bold font-mono">
                        {coupon.code}
                      </code>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => copyToClipboard(coupon.code)}
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <AdminActionBadge
                      label={
                        coupon.discountType === "PERCENTAGE"
                          ? "Percentage"
                          : "Fixed Amount"
                      }
                      variant={
                        coupon.discountType === "PERCENTAGE" ? "purple" : "info"
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 font-medium">
                      {coupon.discountType === "PERCENTAGE" ? (
                        <>
                          <Percent className="h-4 w-4 text-purple-500" />
                          <span>{coupon.discountValue}%</span>
                        </>
                      ) : (
                        <span className="text-emerald-600">
                          {formatCurrency(Number(coupon.discountValue))}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden max-w-[80px]">
                        <div
                          className="h-full bg-primary rounded-full"
                          style={{
                            width: coupon.usageLimit
                              ? `${Math.min(
                                  (coupon.usedCount / coupon.usageLimit) * 100,
                                  100
                                )}%`
                              : "0%",
                          }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {coupon.usedCount}/{coupon.usageLimit || "∞"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p className="text-muted-foreground">
                        {format(new Date(coupon.startDate), "dd MMM")} -{" "}
                        {format(new Date(coupon.endDate), "dd MMM yyyy")}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <AdminActionBadge
                      label={
                        isExpired(coupon)
                          ? "Expired"
                          : coupon.isActive
                          ? t("coupons.active")
                          : t("coupons.inactive")
                      }
                      variant={
                        isExpired(coupon)
                          ? "danger"
                          : coupon.isActive
                          ? "success"
                          : "warning"
                      }
                    />
                  </TableCell>
                  {(canUpdate || canDelete) && (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {canUpdate && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => {
                              setSelectedCoupon(coupon);
                              setIsEditDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}
                        {canDelete && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                            onClick={() => {
                              setSelectedCoupon(coupon);
                              setIsDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </AdminTableWrapper>

      {/* Pagination with page numbers - only show when needed */}
      {meta && filteredCoupons.length > 0 && meta.total > meta.limit && (
        <DataTablePagination
          page={page}
          total={meta.total}
          limit={meta.limit}
        />
      )}

      {/* Dialogs */}
      {selectedCoupon && (
        <>
          <EditCouponDialog
            coupon={selectedCoupon}
            open={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
          />
          <DeleteConfirmDialog
            open={isDeleteDialogOpen}
            onOpenChange={setIsDeleteDialogOpen}
            title={t("confirmTitle")}
            description={t("coupons.deleteConfirm", {
              item: selectedCoupon.code,
            })}
            action={() => deleteCouponAction(selectedCoupon.id)}
            successMessage={t("coupons.successDelete")}
          />
        </>
      )}

      <CreateCouponDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
    </div>
  );
}
