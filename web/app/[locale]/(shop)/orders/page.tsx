import { Link } from "@/i18n/routing";
import { http } from "@/lib/http";
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

async function DynamicOrders() {
  let orders: Order[] = [];
  let error = null;

  // Trigger dynamic access before try/catch to allow PPR to work correctly.
  // In Next.js 16, cookies() throws a special error during static prerender.
  await cookies();

  try {
    const res = await http<{ data: Order[] }>("/orders/my-orders");
    orders = res.data || [];
  } catch (e: unknown) {
    console.error("Lấy danh sách đơn hàng thất bại", e);
    error = e;
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-32 flex items-center justify-center min-h-[60vh]">
        <GlassCard className="max-w-md w-full p-8 md:p-12 text-center space-y-6 backdrop-blur-xl bg-white/5 border-white/10">
          <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-red-500"
            >
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
              <line x1="18" y1="8" x2="23" y2="13" />
              <line x1="23" y1="8" x2="18" y2="13" />
            </svg>
          </div>

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

  return <OrdersClient orders={orders} />;
}

import { LoadingScreen } from "@/components/atoms/loading-screen";

export default async function OrdersPage() {
  return (
    <Suspense
      fallback={
        <LoadingScreen fullScreen={false} message="Loading your orders..." />
      }
    >
      <DynamicOrders />
    </Suspense>
  );
}
