"use client";

import { deleteCouponAction } from "@/actions/admin";
import { Button } from "@/components/atoms/button";
import { Card } from "@/components/atoms/card";
import { DataTableEmptyRow } from "@/components/atoms/data-table-empty-row";
import { StatusBadge } from "@/components/atoms/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/atoms/table";
import { CreateCouponDialog } from "@/components/organisms/admin/create-coupon-dialog";
import { DeleteConfirmDialog } from "@/components/organisms/admin/delete-confirm-dialog";
import { EditCouponDialog } from "@/components/organisms/admin/edit-coupon-dialog";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";
import { Coupon } from "@/types/models";
import { Copy, Edit, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

interface CouponsClientProps {
  initialCoupons: Coupon[];
}

export function CouponsClient({ initialCoupons }: CouponsClientProps) {
  const t = useTranslations("admin");
  const { hasPermission } = useAuth();
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t("coupons.title")}
          </h1>
          <p className="text-muted-foreground">{t("coupons.subtitle")}</p>
        </div>
        {canCreate && (
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            {t("coupons.createNew")}
          </Button>
        )}
      </div>

      <Card className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("coupons.codeLabel")}</TableHead>
              <TableHead>{t("coupons.typeLabel")}</TableHead>
              <TableHead>{t("coupons.valueLabel")}</TableHead>
              <TableHead>{t("coupons.usage")}</TableHead>
              <TableHead>{t("coupons.validity")}</TableHead>
              <TableHead>{t("coupons.status")}</TableHead>
              {(canUpdate || canDelete) && (
                <TableHead className="text-right">{t("actions")}</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {initialCoupons.length === 0 ? (
              <DataTableEmptyRow
                colSpan={canUpdate || canDelete ? 7 : 6}
                message={t("coupons.noFound")}
              />
            ) : (
              initialCoupons.map((coupon) => (
                <TableRow
                  key={coupon.id}
                  className="hover:bg-muted/50 transition-colors"
                >
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <code className="bg-muted px-2 py-1 rounded text-xs font-mono">
                        {coupon.code}
                      </code>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => copyToClipboard(coupon.code)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    {coupon.discountType === "PERCENTAGE"
                      ? t("coupons.percentageValue")
                      : t("coupons.fixed")}
                  </TableCell>
                  <TableCell>
                    {coupon.discountType === "PERCENTAGE"
                      ? `${coupon.discountValue}%`
                      : formatCurrency(Number(coupon.discountValue))}
                  </TableCell>
                  <TableCell>
                    {coupon.usedCount} /{" "}
                    {coupon.usageLimit || t("coupons.infinity")}
                  </TableCell>
                  <TableCell className="text-xs">
                    <div className="flex flex-col gap-1">
                      <span className="text-muted-foreground">
                        {formatDate(coupon.startDate)} -{" "}
                        {formatDate(coupon.endDate)}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <StatusBadge
                      status={coupon.isActive ? "ACTIVE" : "INACTIVE"}
                      label={
                        coupon.isActive
                          ? t("coupons.active")
                          : t("coupons.inactive")
                      }
                    />
                  </TableCell>
                  {(canUpdate || canDelete) && (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        {canUpdate && (
                          <Button
                            variant="ghost"
                            size="icon"
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
                            size="icon"
                            className="text-red-500 hover:text-red-600 hover:bg-red-50"
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
      </Card>

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
