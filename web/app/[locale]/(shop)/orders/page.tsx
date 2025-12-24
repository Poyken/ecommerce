import { Link } from "@/i18n/routing";
import { OrdersClient, type Order } from "./orders-client";

import { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Orders | Luxe",
  description: "View your order history and track shipments.",
};

import { GlassCard } from "@/components/atoms/glass-card";

/**
 * =====================================================================
 * ORDERS PAGE - Lịch sử đơn hàng
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * DATA FETCHING:
 * - Fetch danh sách đơn hàng từ API `/orders/my-orders`.
 * - API này yêu cầu Header `Authorization: Bearer <token>`,
 *   được `http` utility tự động thêm vào (lấy từ cookies).
 *
 * ERROR HANDLING:
 * - Nếu fetch lỗi (thường là 401 Unauthorized), hiển thị UI yêu cầu đăng nhập.
 * - Đây là cách xử lý "Graceful Degradation" - thay vì crash trang, hiển thị thông báo thân thiện.
 *
 * COMPONENT STRUCTURE:
 * - `OrdersPage` (Server): Fetch dữ liệu.
 * - `OrdersClient` (Client): Hiển thị danh sách, filter, pagination.
 * =====================================================================
 */
import { cookies } from "next/headers";
import { Suspense } from "react";

async function DynamicOrders({
  searchParams,
}: {
  searchParams?: Promise<{ page?: string }>;
}) {
  let orders: Order[] = [];
  let meta = null;
  let error = null;

  // Trigger dynamic access
  await cookies();
  const params = await searchParams;
  const page = Number(params?.page) || 1;

  try {
    const res = await getMyOrdersAction(page, 5); // Limit 5 for better UI demo on small lists, or 10
    if ("data" in res) {
      orders = res.data || [];
      meta = res.meta;
    } else {
      error = res.error;
    }
  } catch (e: unknown) {
    console.error("Lấy danh sách đơn hàng thất bại", e);
    error = e;
  }

  if (error) {
    // ... existing error UI ...
    return (
      <div className="container mx-auto px-4 py-32 flex items-center justify-center min-h-[60vh]">
        {/* ... (Keep existing Error UI same as before) ... */}
        <GlassCard className="max-w-md w-full p-8 md:p-12 text-center space-y-6 backdrop-blur-xl bg-white/5 border-white/10">
          {/* ... svg ... */}
          <div className="space-y-2">
            <h2 className="text-2xl font-bold tracking-tight">
              Login Required
            </h2>
            <p className="text-muted-foreground">
              Please log in to view your order history.
            </p>
          </div>
          <div className="pt-4">
            <Link
              href="/login"
              className="inline-flex items-center justify-center h-10 px-8 py-2 text-sm font-medium transition-colors rounded-full bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20"
            >
              Log In
            </Link>
          </div>
        </GlassCard>
      </div>
    );
  }

  return <OrdersClient orders={orders} meta={meta ?? null} />;
}

import { getMyOrdersAction } from "@/actions/order"; // Import action
import { LoadingScreen } from "@/components/atoms/loading-screen";

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  return (
    <Suspense
      fallback={
        <LoadingScreen fullScreen={false} message="Loading your orders..." />
      }
    >
      <DynamicOrders searchParams={searchParams} />
    </Suspense>
  );
}
