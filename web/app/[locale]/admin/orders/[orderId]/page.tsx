import { Badge } from "@/components/ui/badge";
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
import { OrderItem } from "@/types/models";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { notFound } from "next/navigation";

/**
 * =====================================================================
 * ORDER DETAILS PAGE - Chi tiết đơn hàng (Server Component)
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. DYNAMIC ROUTE:
 * - Đây là trang động với URL pattern: `/admin/orders/[orderId]`
 * - `[orderId]` là dynamic segment, Next.js sẽ tự động truyền vào params.
 *
 * 2. CHI TIẾT ĐƠN HÀNG:
 * - Hiển thị đầy đủ thông tin: Thông tin đơn hàng, Khách hàng, Danh sách sản phẩm.
 * - Sử dụng `getOrderDetailsAction` để fetch dữ liệu từ Server.
 *
 * 3. ERROR HANDLING:
 * - Nếu đơn hàng không tồn tại, gọi `notFound()` để hiển thị 404 page.
 * - Nếu có lỗi khác, hiển thị thông báo lỗi rõ ràng.
 * =====================================================================
 */

export default async function OrderDetailsPage({
  params,
}: {
  params: Promise<{ orderId: string; locale: string }>;
}) {
  const { orderId, locale } = await params;
  const t = await getTranslations({ locale, namespace: "admin" });

  const { data: order, error } = await getOrderDetailsAction(orderId);

  if (error || !order) {
    if (error?.includes("not found")) {
      notFound();
    }
    return (
      <div className="p-6 text-red-600">
        {t("error")}: {error || "Order not found"}
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-8">
      <div className="flex justify-between items-center border-b pb-4">
        <h1 className="text-2xl font-bold">{t("orders.details")}</h1>
        <Link
          href="/admin/orders"
          className="text-sm text-gray-500 hover:underline"
        >
          ← {t("back")}
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* ORDER INFO */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg border-b pb-2">
            {t("orders.info")}
          </h3>
          <div className="grid grid-cols-[120px_1fr] gap-2 text-sm">
            <span className="font-medium text-gray-500">
              {t("orders.idLabel")}:
            </span>
            <span className="font-mono">{order.id}</span>

            <span className="font-medium text-gray-500">
              {t("orders.dateLabel")}:
            </span>
            <span>{new Date(order.createdAt).toLocaleString(locale)}</span>

            <span className="font-medium text-gray-500">
              {t("orders.statusLabel")}:
            </span>
            <span>
              <Badge
                variant={order.status === "PENDING" ? "warning" : "default"}
              >
                {t(`orders.statusMapping.${order.status}` as any)}
              </Badge>
            </span>

            <span className="font-medium text-gray-500">
              {t("orders.totalLabel")}:
            </span>
            <span className="font-semibold text-lg text-primary">
              {formatCurrency(Number(order.totalAmount))}
            </span>

            <span className="font-medium text-gray-500">Payment Method:</span>
            <span>{order.paymentMethod || "N/A"}</span>

            <span className="font-medium text-gray-500">Payment Status:</span>
            <span>
              <Badge
                variant={
                  order.paymentStatus === "PAID"
                    ? "success"
                    : order.paymentStatus === "PENDING"
                    ? "warning"
                    : "default"
                }
              >
                {order.paymentStatus}
              </Badge>
            </span>

            {order.status === "CANCELLED" &&
              order.cancellationReason && (
                <>
                  <span className="font-medium text-red-500">
                    Cancellation Reason:
                  </span>
                  <span className="text-red-500 font-medium">
                    {order.cancellationReason}
                  </span>
                </>
              )}
          </div>
        </div>

        {/* CUSTOMER INFO */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg border-b pb-2">
            {t("orders.customerInfo")}
          </h3>
          <div className="grid grid-cols-[120px_1fr] gap-2 text-sm">
            <span className="font-medium text-gray-500">
              {t("orders.nameLabel")}:
            </span>
            <span>{order.recipientName || order.user?.firstName || "N/A"}</span>

            <span className="font-medium text-gray-500">
              {t("orders.emailLabel")}:
            </span>
            <span>{order.user?.email || "N/A"}</span>

            <span className="font-medium text-gray-500">
              {t("orders.phoneLabel")}:
            </span>
            <span>{order.phoneNumber || "N/A"}</span>

            <span className="font-medium text-gray-500">
              {t("orders.addressLabel")}:
            </span>
            <span>{order.shippingAddress || "N/A"}</span>

            {/* {(order.details as any)?.note && (
                <>
                   <span className="font-medium text-gray-500">
                    Note:
                   </span>
                   <span>{(order.details as any).note}</span>
                </>
            )} */}
          </div>
        </div>
      </div>

      {/* ORDER ITEMS */}
      <div>
        <h3 className="font-semibold text-lg mb-4">{t("orders.items")}</h3>
        <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
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
                        item.sku?.product?.id
                          ? `/products/${item.sku.product.id}?skuId=${item.sku.id}`
                          : "#"
                      }
                      target="_blank"
                      className="hover:underline text-primary"
                    >
                      {item.sku?.product?.name || t("orders.unknownProduct")}
                    </Link>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-gray-500">
                    {item.sku?.skuCode}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(Number(item.priceAtPurchase))}
                  </TableCell>
                  <TableCell className="text-right">{item.quantity}</TableCell>
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
  );
}
