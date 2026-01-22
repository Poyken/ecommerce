import { GlassButton } from "@/components/shared/glass-button";
import { getOrderDetailsAction } from "@/features/orders/actions";
import { formatCurrency } from "@/lib/utils";
import { AlertCircle, ArrowRight, ShoppingBag, XCircle } from "lucide-react";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { RetryOrderButton } from "./retry-button";

interface OrderItem {
  id: string;
  skuId?: string; // May exist directly
  sku?: {
    id: string;
    product?: {
      id: string;
      name: string;
    };
  };
  quantity: number;
  priceAtPurchase: number;
}

interface Order {
  id: string;
  totalAmount: number;
  items: OrderItem[];
}

/**
 * =================================================================================================
 * ORDER FAILED PAGE - TRANG THÔNG BÁO THANH TOÁN THẤT BẠI
 * =================================================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. ERROR CONTEXT:
 *    - Hiển thị thông báo lỗi cụ thể dựa trên việc có truy vấn được `order` hay không.
 *    - Nhấn mạnh rằng "No money has been charged" để giảm bớt sự lo lắng của khách hàng.
 *
 * 2. RECOVERABILITY (RETRY):
 *    - `RetryOrderButton`: Một component cực kỳ quan trọng giúp User mua lại nhanh chóng
 *      bằng cách đẩy lại các item từ đơn hàng cũ vào giỏ hàng và mở lại checkout.
 *
 * 3. DATA TYPES:
 *    - Định nghĩa `OrderItem` và `Order` interface ngay tại file để quản lý cấu trúc dữ liệu
 *      trả về từ Server Action (Type Casting). *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Đóng vai trò quan trọng trong kiến trúc hệ thống, hỗ trợ các chức năng nghiệp vụ cụ thể.

 * =================================================================================================
 */
export default async function OrderFailedPage({
  params,
}: {
  params: Promise<{ orderId: string; locale: string }>;
}) {
  const { orderId } = await params;
  const t = await getTranslations("orderStatus");
  const result = await getOrderDetailsAction(orderId);

  const order = result.data as Order | null;

  return (
    <div className="min-h-screen bg-background relative overflow-hidden transition-colors duration-500 flex items-center justify-center p-4 font-sans">
      {/* Cinematic Background & Aurora Glow */}
      <div className="fixed inset-0 bg-cinematic pointer-events-none z-0 opacity-40" />
      <div className="fixed top-[-10%] left-[-10%] w-[60vw] h-[60vw] bg-(--aurora-blue)/15 rounded-full blur-[150px] animate-pulse-glow z-0 pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-(--aurora-purple)/15 rounded-full blur-[150px] animate-float z-0 pointer-events-none" />

      <div className="w-full max-w-2xl glass-premium border-none rounded-4xl p-10 md:p-16 shadow-2xl relative z-10 text-center space-y-10">
        <div className="w-24 h-24 bg-destructive rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-destructive/40 rotate-12 group hover:rotate-0 transition-transform duration-500">
          <XCircle className="w-12 h-12 text-white" strokeWidth={3} />
        </div>

        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-destructive/10 border border-destructive/20 text-destructive text-[10px] font-black uppercase tracking-[0.3em] mx-auto">
             <div className="size-1.5 rounded-full bg-destructive animate-pulse" />
             <span>{t("failed")}</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter uppercase leading-none bg-clip-text text-transparent bg-linear-to-b from-white to-white/40">
            {t("paymentFailed")}
          </h1>
          <p className="text-muted-foreground/60 font-serif italic text-xl leading-relaxed max-w-md mx-auto">
             {order
              ? t.rich("paymentProblem", {
                  id: () => (
                    <span className="font-sans font-black text-destructive uppercase tracking-tighter not-italic">
                      #{order.id.slice(-8).toUpperCase()}
                    </span>
                  ),
                })
              : t("paymentProblemBrief")}
          </p>
        </div>

        {/* Error Info */}
        <div className="flex items-center justify-center gap-3 py-6 px-8 glass-card border-none bg-destructive/5 rounded-2xl">
          <AlertCircle className="w-5 h-5 text-destructive shrink-0" />
          <p className="text-sm text-destructive font-black uppercase tracking-widest text-left">
            {t("paymentProblemDetail")}
          </p>
        </div>

        {/* Order Details Brief */}
        {order && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 py-10 border-y border-white/10 my-10 text-left">
            <div className="space-y-2">
              <span className="text-[10px] uppercase tracking-[0.3em] font-black text-muted-foreground/40">
                {t("orderID")}
              </span>
              <p className="text-xl font-bold tracking-tight uppercase">
                #{order.id.slice(-8).toUpperCase()}
              </p>
            </div>
            <div className="space-y-2 sm:text-right">
              <span className="text-[10px] uppercase tracking-[0.3em] font-black text-muted-foreground/40">
                {t("totalAmount")}
              </span>
              <p className="text-3xl font-black tracking-tighter text-primary">
                {formatCurrency(Number(order.totalAmount))}
              </p>
            </div>
            <div className="space-y-2">
              <span className="text-[10px] uppercase tracking-[0.3em] font-black text-muted-foreground/40">
                {t("status")}
              </span>
              <p className="text-lg font-bold text-destructive uppercase tracking-widest">{t("cancelled")}</p>
            </div>
            <div className="space-y-2 sm:text-right">
              <span className="text-[10px] uppercase tracking-[0.3em] font-black text-muted-foreground/40">
                {t("payment")}
              </span>
              <p className="text-lg font-bold text-destructive uppercase tracking-widest">{t("failed")}</p>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          {order && (
            <Link href={`/orders/${order.id}`} className="w-full sm:w-auto">
               <GlassButton
                className="w-full h-14 px-8 text-xs font-black uppercase tracking-widest glass-premium border-white/10"
                variant="outline"
              >
                 {t("viewDetails")}
              </GlassButton>
            </Link>
          )}
          {order && order.items && order.items.length > 0 && (
            <RetryOrderButton
              order={{
                id: order.id,
                totalAmount: Number(order.totalAmount),
                items: order.items
                  .map((item) => ({
                    // Get skuId from either direct property or nested sku object
                    skuId: item.skuId || item.sku?.id || "",
                    quantity: item.quantity,
                  }))
                  .filter((item) => item.skuId !== ""), // Filter out items without valid skuId
              }}
            />
          )}
          <Link href="/shop" className="w-full sm:w-auto">
             <GlassButton 
              className="w-full h-14 px-8 text-xs font-black uppercase tracking-widest border-none" 
              variant="ghost"
            >
               {t("continueShopping")}
            </GlassButton>
          </Link>
        </div>

        <div className="pt-10 text-muted-foreground/40 text-[10px] font-black uppercase tracking-[0.3em] flex items-center justify-center gap-3">
          <div className="size-1 rounded-full bg-muted-foreground/40" />
          <span>{t("needHelp")}</span>
          <div className="size-1 rounded-full bg-muted-foreground/40" />
        </div>
      </div>
    </div>
  );
}
