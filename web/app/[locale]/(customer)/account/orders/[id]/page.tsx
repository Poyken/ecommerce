import { StatusBadge } from "@/components/shared/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { BankTransferQR } from "@/features/orders/components/bank-transfer-qr";
import { BuyAgainButton } from "@/features/orders/components/buy-again-button";
import { CancelOrderButton } from "@/features/orders/components/cancel-order-button";
import { RequestReturnButton } from "@/features/orders/components/request-return-button";
import { Link } from "@/i18n/routing";
import { orderService } from "@/features/orders/services/order.service";
import { formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { getTranslations } from "next-intl/server";
import Image from "next/image";



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
    image?: string | null;
    imageUrl?: string | null;
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
  createdAt: string;
  items: OrderItem[];
  paymentMethod?: string;
  paymentStatus?: string;
  cancellationReason?: string;
  shippingCode?: string;
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

import { ShopEmptyState } from "@/components/shared/shop-empty-state";
import { AlertCircle, PackageSearch } from "lucide-react";
import { redirect } from "next/navigation";

async function DynamicOrderDetail({ id }: { id: string }) {
  let order: Order | null = null;
  let error = null;

  // Trigger dynamic access before try/catch to allow PPR to work correctly.
  await cookies();

  const t = await getTranslations("orders");

  try {
    const res = await orderService.getMyOrderDetails(id);
    order = res.data as Order;
  } catch (e: any) {
    if (e?.status === 401) {
      redirect("/login");
    }
    error = e instanceof Error ? e.message : t("orderNotFound");
  }

  if (error || !order) {
    return (
      <div className="container mx-auto px-4 pt-24 pb-8 max-w-4xl">
        <ShopEmptyState
          icon={error ? AlertCircle : PackageSearch}
          title={error ? t("orderNotFound") : t("loadingDetails")}
          description={
            error
              ? t("checkOrderId") || "Please check the order ID and try again."
              : "Retrieving your order information..."
          }
          actionHref="/orders"
          actionLabel={t("backToOrders")}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent font-sans selection:bg-accent/30 relative overflow-hidden transition-colors duration-500 pb-24">
      {/* Cinematic Background & Aurora Glow */}
      <div className="fixed inset-0 bg-cinematic pointer-events-none z-0 opacity-40" />
      <div className="fixed top-[-10%] left-[-10%] w-[60vw] h-[60vw] bg-(--aurora-blue)/15 rounded-full blur-[150px] animate-pulse-glow z-0 pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-(--aurora-purple)/15 rounded-full blur-[150px] animate-float z-0 pointer-events-none" />

      <div className="container relative mx-auto px-4 md:px-8 max-w-7xl z-10 pt-32">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-10 mb-16">
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-premium border border-white/10 text-accent text-[10px] font-black uppercase tracking-[0.3em]">
               <PackageSearch className="size-3" />
               <span>Order Details</span>
            </div>
            <h1 className="text-6xl md:text-8xl font-bold tracking-tighter uppercase leading-none bg-clip-text text-transparent bg-linear-to-b from-foreground to-foreground/40">
              <span className="block">{t("orderNumber")} {order?.id?.slice(0, 8)}</span>
              <span className="font-serif italic font-normal text-muted-foreground/60 block mt-4 normal-case tracking-tight">Luxury Fulfillment</span>
            </h1>
            <div className="flex items-center gap-4">
              <Link href="/orders" className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground hover:text-accent transition-colors flex items-center gap-2">
                <div className="size-6 rounded-lg glass-premium border border-white/10 flex items-center justify-center">
                   ←
                </div>
                <span>{t("backToOrders")}</span>
              </Link>
              <div className="w-px h-4 bg-white/10" />
              <div className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">
                {format(new Date(order.createdAt), "dd MMMM yyyy")}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            {order.status === "PENDING" && (
              <CancelOrderButton orderId={order.id} />
            )}
            {(order.status === "DELIVERED" || order.status === "COMPLETED") && (
              <RequestReturnButton orderId={order.id} />
            )}
          </div>
        </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          <div className="glass-premium rounded-4xl border border-white/10 overflow-hidden shadow-2xl">
            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-white/5">
              <h2 className="text-xs font-black uppercase tracking-[0.3em] text-white/60">{t("orderItems")}</h2>
              <StatusBadge
                status={order.status}
                label={t(`status.${order.status}`)}
              />
            </div>
            <div className="p-8">
              {/* Show cancellation reason if order is cancelled */}
              {order.status === "CANCELLED" && order.cancellationReason && (
                <div className="mb-8 p-6 glass-premium border border-red-500/20 rounded-2xl bg-red-500/5">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-red-500 mb-2">
                    {t("cancellationReason") || "Cancellation Reason"}
                  </p>
                  <p className="text-sm text-red-100/80 font-medium">
                    {order.cancellationReason}
                  </p>
                </div>
              )}

              <div className="space-y-6">
                {order.items.map((item) => (
                  <Link
                    key={item.id}
                    href={`/products/${item.sku.product.id}?skuId=${item.sku.id}`}
                    className="flex gap-6 p-6 rounded-3xl transition-all duration-500 hover:bg-white/5 group border border-transparent hover:border-white/10"
                  >
                    <div className="shrink-0 w-24 h-24 glass-premium rounded-2xl overflow-hidden relative border border-white/10">
                      <Image
                        src={
                          item.sku.imageUrl ||
                          item.sku.image ||
                          (item.sku.product.images?.[0] as any)?.url ||
                          item.sku.product.images?.[0] ||
                          `https://picsum.photos/seed/${item.sku.product.id}/200`
                        }
                        alt={item.sku.product.name}
                        fill
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                    </div>
                    <div className="grow flex flex-col justify-between">
                      <div>
                        <h3 className="text-xl font-bold text-white group-hover:text-accent transition-colors tracking-tight">
                          {item.sku.product.name}
                        </h3>

                        <div className="mt-2 flex flex-wrap gap-2">
                          {item.sku.optionValues &&
                            item.sku.optionValues.length > 0 && 
                              item.sku.optionValues.map((ov, i) => (
                                <span key={i} className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 bg-white/5 px-2 py-1 rounded-md">
                                  {ov.optionValue?.option?.name}: {ov.optionValue?.value}
                                </span>
                              ))
                          }
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-end mt-4">
                        <div className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground/60">
                          {t("quantity")}: {item.quantity} &times; {formatCurrency(Number(item.priceAtPurchase))}
                        </div>
                        <div className="text-right flex flex-col items-end gap-3">
                          <span className="text-xl font-bold text-white tracking-tighter">
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
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Bank Transfer QR Code - Only for PENDING Bank Transfer */}
          {order.status === "PENDING" &&
            order.paymentMethod === "BANKING" &&
            (order.paymentStatus === "UNPAID" ||
              order.paymentStatus === "PENDING") && (
              <div className="glass-premium rounded-4xl border border-white/10 overflow-hidden p-8 shadow-2xl">
                <BankTransferQR
                  amount={order.totalAmount}
                  orderCode={order.id.slice(0, 8).toUpperCase()}
                  orderId={order.id}
                  createdAt={order.createdAt}
                />
              </div>
            )}
        </div>

        <div className="lg:col-span-4 space-y-8 h-fit sticky top-32">
          <div className="glass-premium rounded-4xl border border-white/10 overflow-hidden shadow-2xl">
            <div className="p-8 border-b border-white/5 bg-white/5">
              <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/60">{t("summary")}</h2>
            </div>
            <div className="p-8 space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground/60 font-bold uppercase tracking-widest text-[10px]">{t("subtotal")}</span>
                <span className="font-bold text-white">
                  {formatCurrency(
                    Number(order.totalAmount) - Number(order.shippingFee)
                  )}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground/60 font-bold uppercase tracking-widest text-[10px]">{t("shipping")}</span>
                <span className="font-bold text-white">{formatCurrency(Number(order.shippingFee))}</span>
              </div>
              <div className="h-px bg-white/5 my-4" />
              <div className="flex justify-between items-end">
                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-accent mb-1">{t("total")}</span>
                <span className="text-4xl font-bold tracking-tighter text-white">
                  {formatCurrency(Number(order.totalAmount))}
                </span>
              </div>
            </div>
          </div>

          <div className="glass-premium rounded-4xl border border-white/10 overflow-hidden shadow-2xl">
            <div className="p-8 border-b border-white/5 bg-white/5">
              <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/60">{t("shippingInfo")}</h2>
            </div>
            <div className="p-8 space-y-8">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 text-white font-bold tracking-tight">
                  <div className="size-8 rounded-xl glass-premium border border-white/10 flex items-center justify-center shrink-0">
                    <span className="text-[10px]">👤</span>
                  </div>
                  <span className="text-xl">{order.recipientName}</span>
                </div>
                <p className="text-muted-foreground flex items-center gap-2 text-sm">
                  <span>📞</span> {order.phoneNumber}
                </p>
                <p className="text-muted-foreground/80 leading-relaxed font-medium text-sm">
                   📍 {order.shippingAddress}
                </p>
              </div>

              {order.shippingCode && (
                <div className="p-6 glass-premium border border-accent/20 rounded-3xl bg-accent/5">
                  <p className="text-[10px] text-accent uppercase tracking-[0.3em] font-black mb-3">
                    {t("shippingCode") || "Tracking ID"}
                  </p>
                  <p className="font-mono text-2xl text-white font-black tracking-tighter mb-4">
                    {order.shippingCode}
                  </p>
                  <a
                    href={`https://tracking.ghn.dev/?order_code=${order.shippingCode}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-10 items-center justify-center rounded-xl glass-premium border border-white/10 px-6 text-[10px] font-black uppercase tracking-[0.2em] text-white hover:bg-white/10 transition-all"
                  >
                    {t("trackOrder") || "Track Path"} &rarr;
                  </a>
                </div>
              )}

              <div className="h-px bg-white/5" />

              <div className="space-y-6">
                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">{t("paymentInfo")}</h4>
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground/60 font-black uppercase tracking-widest">{t("method")}</span>
                    <span className="font-black uppercase tracking-widest text-white">
                      {t(`paymentMethods.${order.paymentMethod || "COD"}`)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground/60 font-black uppercase tracking-widest">{t("statusLabel")}</span>
                    <StatusBadge
                      status={order.paymentStatus || "UNPAID"}
                      label={
                        order.paymentStatus
                          ? t(`status.${order.paymentStatus}`)
                          : t("status.UNPAID")
                      }
                    />
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-white/5 text-[10px] text-muted-foreground/40 font-black uppercase tracking-[0.3em]">
                {t("placedOn")}{" "}
                {format(new Date(order.createdAt), "dd/MM/yyyy")}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);
}

import { LoadingScreen } from "@/components/shared/loading-screen";

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
