"use client";

import { getOrderDetailsAction } from "@/actions/admin";
import { Badge } from "@/components/atoms/badge";
import { Button } from "@/components/atoms/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/atoms/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/atoms/table";
import { formatCurrency } from "@/lib/utils";
import { Order, OrderItem } from "@/types/models";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useEffect, useState } from "react";

/**
 * =====================================================================
 * ORDER DETAILS DIALOG - Xem chi tiết đơn hàng
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. COMPREHENSIVE DATA:
 * - Hiển thị 3 nhóm thông tin chính: Thông tin đơn hàng (ID, Ngày, Trạng thái), Thông tin khách hàng (Tên, SĐT, Địa chỉ) và Danh sách sản phẩm đã mua.
 *
 * 2. PRICE AT PURCHASE:
 * - Quan trọng: Hiển thị `priceAtPurchase` thay vì giá hiện tại của sản phẩm. Vì giá sản phẩm có thể thay đổi theo thời gian, nhưng hóa đơn phải giữ nguyên giá tại thời điểm khách đặt hàng.
 *
 * 3. UI COMPONENTS:
 * - Sử dụng `Table` để hiển thị danh sách sản phẩm một cách ngăn nắp.
 * - `Badge` giúp làm nổi bật trạng thái đơn hàng.
 * =====================================================================
 */

export function OrderDetailsDialog({
  orderId,
  open,
  onOpenChange,
}: {
  orderId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("admin");

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="!max-w-5xl max-h-[85vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle>{t("orders.details")}</DialogTitle>
        </DialogHeader>
        <OrderDetailsContent orderId={orderId} onOpenChange={onOpenChange} />
      </DialogContent>
    </Dialog>
  );
}

function OrderDetailsContent({
  orderId,
  onOpenChange,
}: {
  orderId: string | null;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("admin");
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    if (orderId) {
      const fetchOrder = async () => {
        // Use a slight delay or just let it be async to avoid sync setState in effect
        // but actually, we can just check if we really need to set it here.
        // If we initialize loading based on orderId change, it might be better.
        setLoading(true);
        setError(null);
        try {
          const result = await getOrderDetailsAction(orderId);
          if (isMounted) {
            if (result.data) {
              setOrder(result.data);
            } else {
              setError(result.error || t("error"));
            }
          }
        } catch (err: unknown) {
          if (isMounted) setError(err instanceof Error ? err.message : t("error"));
        } finally {
          if (isMounted) setLoading(false);
        }
      };
      fetchOrder();
    }
    return () => { isMounted = false; };
  }, [orderId, t]);

  return (
    <>
      <div className="flex-1 overflow-y-auto p-6">
        {loading && <div className="py-8 text-center">{t("loading")}</div>}

        {error && <div className="py-8 text-center text-red-600">{error}</div>}

        {order && !loading && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">
                  {t("orders.info")}
                </h3>
                <div className="grid grid-cols-[100px_1fr] gap-2 text-sm">
                  <span className="font-medium text-gray-500">
                    {t("orders.idLabel")}:
                  </span>
                  <span className="font-mono">{order.id}</span>

                  <span className="font-medium text-gray-500">
                    {t("orders.dateLabel")}:
                  </span>
                  <span>{new Date(order.createdAt).toLocaleString()}</span>

                  <span className="font-medium text-gray-500">
                    {t("orders.statusLabel")}:
                  </span>
                  <span>
                    <Badge>{t(`orders.statusMapping.${order.status}` as any)}</Badge>
                  </span>

                  <span className="font-medium text-gray-500">
                    {t("orders.totalLabel")}:
                  </span>
                  <span className="font-semibold text-lg">
                    {formatCurrency(Number(order.totalAmount))}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-lg border-b pb-2">
                  {t("orders.customerInfo")}
                </h3>
                <div className="grid grid-cols-[100px_1fr] gap-2 text-sm">
                  <span className="font-medium text-gray-500">
                    {t("orders.nameLabel")}:
                  </span>
                  <span>{order.recipientName || order.user?.firstName}</span>

                  <span className="font-medium text-gray-500">
                    {t("orders.emailLabel")}:
                  </span>
                  <span>{order.user?.email}</span>

                  <span className="font-medium text-gray-500">
                    {t("orders.phoneLabel")}:
                  </span>
                  <span>{order.phoneNumber}</span>

                  <span className="font-medium text-gray-500">
                    {t("orders.addressLabel")}:
                  </span>
                  <span>{order.shippingAddress}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-4">{t("orders.items")}</h3>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead>{t("orders.productLabel")}</TableHead>
                      <TableHead>{t("orders.skuLabel")}</TableHead>
                      <TableHead className="text-right">
                        {t("orders.priceLabel")}
                      </TableHead>
                      <TableHead className="text-right">
                        {t("orders.qtyLabel")}
                      </TableHead>
                      <TableHead className="text-right">
                        {t("orders.totalLabel")}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {order.items?.map((item: OrderItem) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-medium">
                          <Link
                            href={
                              `/products/${item.sku?.product?.id}?skuId=${item.sku?.id}` as any
                            }
                            target="_blank"
                            className="hover:underline text-primary"
                          >
                            {item.sku?.product?.name ||
                              t("orders.unknownProduct")}
                          </Link>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-gray-500">
                          {item.sku?.skuCode}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(Number(item.priceAtPurchase))}
                        </TableCell>
                        <TableCell className="text-right">
                          {item.quantity}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(Number(item.priceAtPurchase) * item.quantity)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="p-6 pt-4 border-t flex justify-end bg-gray-50">
        <Button onClick={() => onOpenChange(false)}>{t("close")}</Button>
      </div>
    </>
  );
}
