"use client";

import { ErrorBoundary } from "@/components/shared/error-boundary";
import { useToast } from "@/components/ui/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getOrderDetailsAction } from "@/features/admin/actions";
import { formatCurrency } from "@/lib/utils";
import { Order, OrderItem } from "@/types/models";
import { Check, Copy } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
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
      <DialogContent className="max-w-5xl! max-h-[85vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle>{t("orders.details")}</DialogTitle>
        </DialogHeader>
        <ErrorBoundary name="OrderDetails">
          <OrderDetailsContent orderId={orderId} onOpenChange={onOpenChange} />
        </ErrorBoundary>
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
  const [copiedId, setCopiedId] = useState(false);
  const { toast } = useToast();

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(true);
    toast({
      title: "Copied!",
      description: "Order ID copied to clipboard",
    });
    setTimeout(() => setCopiedId(false), 2000);
  };

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
          if (isMounted)
            setError(err instanceof Error ? err.message : t("error"));
        } finally {
          if (isMounted) setLoading(false);
        }
      };
      fetchOrder();
    }
    return () => {
      isMounted = false;
    };
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
                  <div className="flex items-center gap-2 group">
                    <span className="font-mono font-bold text-primary">
                      {order.id}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => handleCopyId(order.id)}
                    >
                      {copiedId ? (
                        <Check className="h-3 w-3 text-green-500" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </div>

                  <span className="font-medium text-gray-500">
                    {t("orders.dateLabel")}:
                  </span>
                  <span>{new Date(order.createdAt).toLocaleString()}</span>

                  <span className="font-medium text-gray-500">
                    {t("orders.statusLabel")}:
                  </span>
                  <span>
                    <Badge>
                      {t(`orders.statusMapping.${order.status}` as any)}
                    </Badge>
                  </span>

                  <span className="font-medium text-gray-500">
                    {t("orders.totalLabel")}:
                  </span>
                  <span className="font-semibold text-lg text-primary">
                    {formatCurrency(Number(order.totalAmount))}
                  </span>

                  <span className="font-medium text-gray-500">
                    {t("orders.paymentStatusLabel")}:
                  </span>
                  <span>
                    <Badge
                      variant={
                        order.paymentStatus === "PAID"
                          ? "success"
                          : order.paymentStatus === "FAILED"
                          ? "destructive"
                          : "secondary"
                      }
                    >
                      {t(
                        `orders.paymentStatusMapping.${order.paymentStatus}` as any
                      )}
                    </Badge>
                  </span>

                  <span className="font-medium text-gray-500">
                    {t("orders.paymentMethodLabel")}:
                  </span>
                  <span className="font-medium">
                    {order.paymentMethod || "N/A"}
                  </span>

                  {/* Show cancellation reason if order is cancelled */}
                  {order.status === "CANCELLED" && order.cancellationReason && (
                    <>
                      <span className="font-medium text-red-500">
                        Cancellation Reason:
                      </span>
                      <span className="text-red-600 font-medium">
                        {order.cancellationReason}
                      </span>
                    </>
                  )}
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
              <h3 className="font-semibold text-lg mb-4">
                {t("orders.items")}
              </h3>
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader className="bg-gray-50">
                    <TableRow>
                      <TableHead className="w-[80px]">
                        {t("orders.imageLabel") || "Image"}
                      </TableHead>
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
                        <TableCell>
                          <div className="relative w-12 h-12 rounded overflow-hidden bg-gray-100 border border-gray-100">
                            <Image
                              src={
                                (item.sku as any)?.imageUrl ||
                                (item.sku as any)?.image ||
                                (item.sku?.product?.images?.[0] as any)?.url ||
                                item.sku?.product?.images?.[0] ||
                                `https://picsum.photos/seed/${item.sku?.product?.id}/100`
                              }
                              alt={item.sku?.product?.name || "Product"}
                              fill
                              className="object-cover"
                            />
                          </div>
                        </TableCell>
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
                          {formatCurrency(
                            Number(item.priceAtPurchase) * item.quantity
                          )}
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
