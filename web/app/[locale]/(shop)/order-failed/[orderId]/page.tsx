import { Button } from "@/components/ui/button";
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
 *      trả về từ Server Action (Type Casting).
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
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 mt-12">
      <div className="max-w-3xl w-full space-y-8 bg-white dark:bg-zinc-950 p-8 sm:p-12 rounded-3xl shadow-2xl border border-zinc-100 dark:border-zinc-800 text-center animate-in fade-in slide-in-from-bottom-8 duration-700">
        {/* Error Illustration */}
        <div className="relative w-48 h-48 mx-auto mb-8">
          <div className="absolute inset-0 bg-destructive/20 blur-3xl rounded-full animate-pulse" />
          <XCircle className="absolute -top-2 -right-2 w-12 h-12 text-destructive animate-bounce" />
          <ShoppingBag className="w-full h-full text-zinc-400 relative z-10" />
        </div>

        <div className="space-y-4">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            {t("paymentFailed")}
          </h1>
          <p className="text-lg text-zinc-500 dark:text-zinc-400 max-w-md mx-auto">
            {order
              ? t.rich("paymentProblem", {
                  id: () => (
                    <span className="font-mono font-bold text-destructive">
                      #{order.id.slice(-8).toUpperCase()}
                    </span>
                  ),
                })
              : t("paymentProblemBrief")}
          </p>
        </div>

        {/* Error Info */}
        <div className="flex items-center justify-center gap-3 py-4 px-6 bg-destructive/5 border border-destructive/20 rounded-xl">
          <AlertCircle className="w-5 h-5 text-destructive shrink-0" />
          <p className="text-sm text-destructive">
            {t("paymentProblemDetail")}
          </p>
        </div>

        {/* Order Details Brief */}
        {order && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-8 border-y border-zinc-100 dark:border-zinc-800 my-8">
            <div className="space-y-1 sm:text-left">
              <span className="text-xs uppercase tracking-wider font-semibold text-zinc-400">
                {t("orderID")}
              </span>
              <p className="font-mono font-medium">
                #{order.id.slice(-8).toUpperCase()}
              </p>
            </div>
            <div className="space-y-1 sm:text-right">
              <span className="text-xs uppercase tracking-wider font-semibold text-zinc-400">
                {t("totalAmount")}
              </span>
              <p className="text-2xl font-bold text-zinc-700 dark:text-zinc-300">
                {formatCurrency(Number(order.totalAmount))}
              </p>
            </div>
            <div className="space-y-1 sm:text-left">
              <span className="text-xs uppercase tracking-wider font-semibold text-zinc-400">
                {t("status")}
              </span>
              <p className="font-medium text-destructive">{t("cancelled")}</p>
            </div>
            <div className="space-y-1 sm:text-right">
              <span className="text-xs uppercase tracking-wider font-semibold text-zinc-400">
                {t("payment")}
              </span>
              <p className="font-medium text-destructive">{t("failed")}</p>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          {order && (
            <Button
              asChild
              size="lg"
              className="w-full sm:w-auto rounded-full group px-8"
            >
              <Link href={`/orders/${order.id}`}>
                {t("viewDetails")}
                <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
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
          <Button
            asChild
            variant="ghost"
            size="lg"
            className="w-full sm:w-auto rounded-full px-8"
          >
            <Link href="/shop">{t("continueShopping")}</Link>
          </Button>
        </div>

        <div className="pt-8 text-zinc-400 text-sm flex items-center justify-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{t("needHelp")}</span>
        </div>
      </div>
    </div>
  );
}
