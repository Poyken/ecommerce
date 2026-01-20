import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";
import { orderService } from "@/features/orders/services/order.service";
import { redirect } from "next/navigation";
import { ReturnRequestForm } from "@/features/returns/components/return-request-form";
import { ApiResponse } from "@/types/dtos";
import { Order } from "@/types/models";

/**
 * =====================================================================
 * RETURN REQUEST PAGE - Trang tạo yêu cầu trả hàng
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. AUTHORIZATION & STATE CHECK:
 * - Chỉ cho phép tạo yêu cầu trả hàng nếu đơn hàng đã ở trạng thái THÀNH CÔNG (Delivered/Completed).
 * - Nếu không, redirect người dùng về trang chi tiết đơn hàng.
 *
 * 2. DATA PASSING:
 * - Fetch dữ liệu đơn hàng trên Server và truyền xuống Client Component `ReturnRequestForm`.
 * - Giảm thiểu việc gọi API dư thừa trên Client.
 * =====================================================================
 */

export default async function ReturnRequestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  await cookies();
  const t = await getTranslations("orders");

  let order: Order | null = null;
  try {
    const res = await orderService.getMyOrderDetails(id);
    order = res.data;
  } catch (error) {
    redirect("/orders");
  }

  if (!order || (order.status !== "DELIVERED" && order.status !== "COMPLETED")) {
    redirect(`/orders/${id}`);
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden transition-colors duration-500 pb-24 font-sans">
      {/* Cinematic Background & Aurora Glow */}
      <div className="fixed inset-0 bg-cinematic pointer-events-none z-0 opacity-40" />
      <div className="fixed top-[-10%] left-[-10%] w-[60vw] h-[60vw] bg-(--aurora-blue)/15 rounded-full blur-[150px] animate-pulse-glow z-0 pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-(--aurora-purple)/15 rounded-full blur-[150px] animate-float z-0 pointer-events-none" />

      <div className="container relative mx-auto px-4 md:px-8 max-w-4xl z-10 pt-32">
        <div className="mb-12 space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-premium border border-white/10 text-accent text-[10px] font-black uppercase tracking-[0.3em]">
             <div className="size-1.5 rounded-full bg-accent animate-pulse" />
             <span>Return Center</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter uppercase leading-none bg-clip-text text-transparent bg-linear-to-b from-white to-white/40">
            {t("requestReturn")}
          </h1>
          <p className="text-lg text-muted-foreground/60 font-black uppercase tracking-widest">
            Order #{order.id.slice(0, 8).toUpperCase()} • {new Date(order.createdAt).toLocaleDateString()}
          </p>
        </div>
      
      <ReturnRequestForm order={order} />
      </div>
    </div>
  );
}
