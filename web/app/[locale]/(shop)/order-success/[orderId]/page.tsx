import { getOrderDetailsAction } from "@/actions/order";
import { Button } from "@/components/atoms/button";
import { formatCurrency } from "@/lib/utils";
import { ArrowRight, CheckCircle, Package, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export default async function OrderSuccessPage({
  params,
}: {
  params: Promise<{ orderId: string; locale: string }>;
}) {
  const { orderId } = await params;
  const result = await getOrderDetailsAction(orderId);

  if (!result.data) {
    return notFound();
  }

  const order = result.data;

  // Ideally we would get the illustration URL from an asset folder
  // For now we use the one we generated or a placeholder
  const illustration = "/order-success-illustration.png";

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl w-full space-y-8 bg-white dark:bg-zinc-950 p-8 sm:p-12 rounded-3xl shadow-2xl border border-zinc-100 dark:border-zinc-800 text-center animate-in fade-in slide-in-from-bottom-8 duration-700">
        {/* Celebration Illustration */}
        <div className="relative w-48 h-48 mx-auto mb-8">
          <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full animate-pulse" />
          <CheckCircle className="absolute -top-2 -right-2 w-12 h-12 text-success animate-bounce" />
          <ShoppingBag className="w-full h-full text-primary relative z-10" />
        </div>

        <div className="space-y-4">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            Order Confirmed!
          </h1>
          <p className="text-lg text-zinc-500 dark:text-zinc-400 max-w-md mx-auto">
            Thank you for your purchase. Your order{" "}
            <span className="font-mono font-bold text-primary">
              #{order.id.slice(-8).toUpperCase()}
            </span>{" "}
            has been placed successfully.
          </p>
        </div>

        {/* Order Details Brief */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-8 border-y border-zinc-100 dark:border-zinc-800 my-8">
          <div className="space-y-1 sm:text-left">
            <span className="text-xs uppercase tracking-wider font-semibold text-zinc-400">
              Recipient
            </span>
            <p className="font-medium">{order.recipientName}</p>
          </div>
          <div className="space-y-1 sm:text-right">
            <span className="text-xs uppercase tracking-wider font-semibold text-zinc-400">
              Total Amount
            </span>
            <p className="text-2xl font-bold text-primary">
              {formatCurrency(Number(order.totalAmount))}
            </p>
          </div>
          <div className="space-y-1 sm:text-left">
            <span className="text-xs uppercase tracking-wider font-semibold text-zinc-400">
              Payment Status
            </span>
            <p className="font-medium text-success">{order.paymentStatus}</p>
          </div>
          <div className="space-y-1 sm:text-right">
            <span className="text-xs uppercase tracking-wider font-semibold text-zinc-400">
              Shipping to
            </span>
            <p className="text-sm text-zinc-500 line-clamp-1">
              {order.shippingAddress}
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Button
            asChild
            size="lg"
            className="w-full sm:w-auto rounded-full group px-8"
          >
            <Link href={`/orders/${order.id}`}>
              View Order Details
              <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="lg"
            className="w-full sm:w-auto rounded-full px-8"
          >
            <Link href="/shop">Continue Shopping</Link>
          </Button>
        </div>

        <div className="pt-8 text-zinc-400 text-sm flex items-center justify-center gap-2">
          <Package className="w-4 h-4" />
          <span>
            We'll send you an email with tracking details as soon as it ships.
          </span>
        </div>
      </div>
    </div>
  );
}
