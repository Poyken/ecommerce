"use client";

/**
 * =====================================================================
 * COUPONS CLIENT - Quản lý mã giảm giá (Enhanced)
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. QUẢN LÝ COUPONS (Promotion Management):
 * - Hiển thị danh sách các mã giảm giá hiện có trong hệ thống.
 * - Hỗ trợ lọc theo trạng thái: All (Tất cả), Active (Đang hiệu lực), Expired (Hết hạn).
 *
 * 2. SEARCH & SYNC URL:
 * - Sử dụng `useDebounce` để trì hoãn việc gọi API (Server Action) khi người dùng gõ tìm kiếm.
 * - Khi tìm kiếm, URL sẽ được cập nhật (Sync URL), cho phép bookmark hoặc chia sẻ bộ lọc.
 *
 * 3. TRẠNG THÁI LOADING (isPending):
 * - Sử dụng `useTransition` để theo dõi trạng thái chuyển trang/lọc dữ liệu.
 * - `isPending` được truyền vào `AdminTableWrapper` để hiển thị lớp phủ mờ (blur overlay) khi đang tải. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Đóng vai trò quan trọng trong kiến trúc hệ thống, hỗ trợ các chức năng nghiệp vụ cụ thể.

 * =====================================================================
 */

import { DataTablePagination } from "@/components/shared/data-table-pagination";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { deleteCouponAction } from "@/features/admin/actions";
import {
  AdminActionBadge,
  AdminEmptyState,
  AdminPageHeader,
  AdminTableWrapper,
} from "@/features/admin/components/ui/admin-page-components";
import { CreateCouponDialog } from "@/features/admin/components/coupons/create-coupon-dialog";
import { DeleteConfirmDialog } from "@/features/admin/components/shared/delete-confirm-dialog";
import { EditCouponDialog } from "@/features/admin/components/coupons/edit-coupon-dialog";
import { useAuth } from "@/features/auth/providers/auth-provider";
import { useDebounce } from "@/lib/hooks/use-debounce";
import { cn, formatCurrency } from "@/lib/utils";
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
import { useEffect, useState, useTransition } from "react";

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
  const [searchTerm, setSearchTerm] = useState(
    searchParams.get("search") || ""
  );
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [isPending, startTransition] = useTransition();
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

  // Sync Search with URL
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
        router.push(`/admin/coupons?${params.toString()}`);
      });
    }
  }, [debouncedSearchTerm, router, searchParams]);

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
    startTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", newPage.toString());
      router.push(`/admin/coupons?${params.toString()}`);
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Page Header */}
      <AdminPageHeader
        title={t("coupons.title")}
        subtitle={t("coupons.subtitle")}
        icon={<Ticket className="text-pink-500 fill-pink-500/10" />}
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

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <Tabs
          value={filter}
          onValueChange={(v) => setFilter(v as FilterType)}
          className="w-full"
        >
          <TabsList className="bg-slate-100 dark:bg-slate-900 p-1 rounded-2xl h-14 border-none shadow-inner flex-wrap w-fit">
            <TabsTrigger
              value="all"
              className="rounded-xl px-4 h-12 font-black uppercase tracking-widest text-xs data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-lg data-[state=active]:text-primary transition-all gap-2"
            >
              <Tag className="h-4 w-4" />
              All
              <Badge
                variant="outline"
                className="ml-1 h-5 px-1.5 bg-slate-200 dark:bg-slate-700 text-[10px] font-black"
              >
                {initialCoupons.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger
              value="active"
              className="rounded-xl px-4 h-12 font-black uppercase tracking-widest text-xs data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-lg data-[state=active]:text-emerald-600 transition-all gap-2"
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
              value="expired"
              className="rounded-xl px-4 h-12 font-black uppercase tracking-widest text-xs data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-lg data-[state=active]:text-rose-600 transition-all gap-2"
            >
              <div className="h-2 w-2 rounded-full bg-rose-500" />
              Expired
              <Badge
                variant="outline"
                className="ml-1 h-5 px-1.5 bg-rose-100 dark:bg-rose-900/40 text-rose-600 text-[10px] font-black"
              >
                {expiredCount}
              </Badge>
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative w-full md:w-80">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search coupon code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-11 h-12 rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm focus:ring-primary/20 transition-all font-medium"
          />
          {isPending && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <div className="h-4 w-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            </div>
          )}
        </div>
      </div>

      {/* Table */}
      <AdminTableWrapper isLoading={isPending}>
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
                        {format(new Date(coupon.startDate), "dd/MM/yyyy")} -{" "}
                        {format(new Date(coupon.endDate), "dd/MM/yyyy")}
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
            key={selectedCoupon.id}
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
