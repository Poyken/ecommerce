import { Badge } from "@/components/atoms/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/atoms/card";
import { Separator } from "@/components/atoms/separator";
import { StatusBadge } from "@/components/atoms/status-badge";
import { BuyAgainButton } from "@/components/organisms/orders/buy-again-button";
import { Link } from "@/i18n/routing";
import { http } from "@/lib/http";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { getTranslations } from "next-intl/server";
import Image from "next/image";

/**
 * =====================================================================
 * ORDER DETAIL PAGE - Chi tiết đơn hàng (Dynamic Route)
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. DYNAMIC ROUTES (Thư mục [id]):
 * - Next.js sử dụng cú pháp `[id]` để tạo các trang có URL động (VD: `/orders/123`, `/orders/456`).
 * - Giá trị `id` được truyền vào `params`.
 *
 * 2. SERVER-SIDE DATA FETCHING:
 * - Vì đây là Server Component, ta có thể gọi API trực tiếp bằng `async/await` ngay trong hàm component.
 * - Dữ liệu được fetch trên server giúp trang web hiển thị nội dung ngay lập tức khi user truy cập, tốt cho SEO.
 *
 * 3. DYNAMIC METADATA:
 * - Hàm `generateMetadata` cho phép ta thay đổi tiêu đề trang dựa trên dữ liệu thực tế (VD: "Order #12345 | Luxe").
 *
 * 4. PRICE SNAPSHOT:
 * - `priceAtPurchase`: Đây là giá tại thời điểm mua. Ta KHÔNG dùng giá hiện tại của sản phẩm vì giá có thể thay đổi theo thời gian, nhưng hóa đơn thì phải giữ nguyên giá cũ.
 * =====================================================================
 */

interface OrderItem {
  id: string;
  sku: {
    id: string;
    product: {
      id: string;
      name: string;
      images: string[];
    };
    price: number;
    specs?: Record<string, unknown>;
    optionValues?: {
      optionValue?: {
        value: string;
        option?: {
          name: string;
        };
      };
    }[];
    skuCode?: string;
  };
  quantity: number;
  priceAtPurchase: number;
}

interface Order {
  id: string;
  status: string;
  totalAmount: number;
  shippingFee: number;
  recipientName: string;
  phoneNumber: string;
  shippingAddress: string;
  orderDate: string;
  items: OrderItem[];
  paymentMethod?: string;
}

import { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const t = await getTranslations("orders");
  return {
    title: `${t("orderNumber")}${id.slice(0, 8)} | Luxe`,
    description: t("loadingDetails"),
  };
}

import { cookies } from "next/headers";
import { Suspense } from "react";

async function DynamicOrderDetail({ id }: { id: string }) {
  let order: Order | null = null;
  let error = null;

  // Trigger dynamic access before try/catch to allow PPR to work correctly.
  // In Next.js 16, cookies() throws a special error during static prerender.
  await cookies();

  const t = await getTranslations("orders");

  try {
    const res = await http<{ data: Order }>(`/orders/my-orders/${id}`);
    order = res.data;
  } catch (e: unknown) {
    error = e instanceof Error ? e.message : t("orderNotFound");
  }

  if (error || !order) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">{t("orderDetail")}</h1>
        <div className="bg-red-50 text-red-600 p-4 rounded-md">
          {error || t("orderNotFound")}
        </div>
        <Link
          href="/orders"
          className="text-primary hover:underline mt-4 inline-block"
        >
          &larr; {t("backToOrders")}
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl font-sans">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">
          {t("orderNumber")}
          {order.id.slice(0, 8)}...
        </h1>
        <Link href="/orders" className="text-primary hover:underline">
          &larr; {t("backToOrders")}
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>{t("orderItems")}</CardTitle>
                <StatusBadge
                  status={order.status}
                  label={t(`status.${order.status}`)}
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {order.items.map((item) => (
                  <Link
                    key={item.id}
                    href={`/products/${item.sku.product.id}?skuId=${item.sku.id}`}
                    className="flex gap-4 p-4 rounded-xl transition-all duration-300 hover:bg-black/5 dark:hover:bg-white/5 group border border-transparent hover:border-black/5 dark:hover:border-white/10"
                  >
                    <div className="shrink-0 w-20 h-20 bg-gray-100 rounded-md overflow-hidden relative border border-black/5 dark:border-white/5">
                      {item.sku.product.images?.[0] ? (
                        <Image
                          src={item.sku.product.images[0]}
                          alt={item.sku.product.name}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      ) : (
                        <Image
                          src={`https://picsum.photos/seed/${item.sku.product.id}/200`}
                          alt={item.sku.product.name}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      )}
                    </div>
                    <div className="grow">
                      <h3 className="font-semibold text-primary group-hover:text-primary/80 transition-colors">
                        {item.sku.product.name}
                      </h3>

                      <div className="text-sm text-muted-foreground space-y-1">
                        {item.sku.optionValues &&
                          item.sku.optionValues.length > 0 && (
                            <div className="text-xs text-muted-foreground/80">
                              {item.sku.optionValues
                                .map(
                                  (ov) =>
                                    `${ov.optionValue?.option?.name}: ${ov.optionValue?.value}`
                                )
                                .join(", ")}
                            </div>
                          )}
                        {item.sku.specs && (
                          <div className="text-xs text-muted-foreground/80">
                            {Object.entries(item.sku.specs).map(
                              ([key, value]: [string, unknown]) => (
                                <span key={key} className="mr-3">
                                  {key}: {value as React.ReactNode}
                                </span>
                              )
                            )}
                          </div>
                        )}
                        <div>
                          {t("quantity")}: {item.quantity} &times;{" "}
                          {formatCurrency(Number(item.priceAtPurchase))}
                        </div>
                      </div>
                      <div className="text-right font-medium text-foreground mt-2 flex flex-col items-end gap-2">
                        <span>
                          {formatCurrency(
                            Number(item.priceAtPurchase) * item.quantity
                          )}
                        </span>
                        {(order.status === "DELIVERED" ||
                          order.status === "COMPLETED") && (
                          <BuyAgainButton skuId={item.sku.id} />
                        )}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t("summary")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">{t("subtotal")}</span>
                <span>
                  {formatCurrency(
                    Number(order.totalAmount) - Number(order.shippingFee)
                  )}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">{t("shipping")}</span>
                <span>{formatCurrency(Number(order.shippingFee))}</span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between font-bold text-lg">
                <span>{t("total")}</span>
                <span className="text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(Number(order.totalAmount))}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("shippingInfo")}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-4">
              <div className="space-y-1">
                <p className="font-semibold">{order.recipientName}</p>
                <p>{order.phoneNumber}</p>
                <p className="text-gray-600 whitespace-pre-wrap">
                  {order.shippingAddress}
                </p>
              </div>

              <Separator />

              <div>
                <h4 className="font-semibold mb-2">{t("paymentInfo")}</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">{t("method")}</span>
                    <span className="font-medium text-foreground">
                      {t(`paymentMethods.${order.paymentMethod || "COD"}`)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">{t("statusLabel")}</span>
                    <Badge
                      variant={
                        order.status === "COMPLETED" ||
                        order.status === "DELIVERED"
                          ? "default"
                          : "outline"
                      }
                      className={
                        order.status === "COMPLETED" ||
                        order.status === "DELIVERED"
                          ? "bg-green-100 text-green-700 hover:bg-green-200 border-transparent"
                          : "bg-yellow-50 text-yellow-700 hover:bg-yellow-100 border-yellow-200"
                      }
                    >
                      {order.status === "COMPLETED" ||
                      order.status === "DELIVERED"
                        ? t("paid")
                        : t("pending")}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-2 border-t text-xs text-gray-400">
                {t("placedOn")}{" "}
                {format(new Date(order.orderDate), "dd/MM/yyyy HH:mm")}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

import { LoadingScreen } from "@/components/atoms/loading-screen";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const t = await getTranslations("orders");
  return (
    <Suspense
      fallback={
        <LoadingScreen fullScreen={false} message={t("loadingDetails")} />
      }
    >
      <DynamicOrderDetail id={id} />
    </Suspense>
  );
}
