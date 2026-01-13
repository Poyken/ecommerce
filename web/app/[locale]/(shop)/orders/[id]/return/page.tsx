import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";
import { http } from "@/lib/http";
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
    const res = await http<ApiResponse<Order>>(`/orders/my-orders/${id}`);
    order = res.data;
  } catch (error) {
    redirect("/orders");
  }

  if (!order || (order.status !== "DELIVERED" && order.status !== "COMPLETED")) {
    redirect(`/orders/${id}`);
  }

  return (
    <div className="container mx-auto px-4 pt-24 pb-8 max-w-4xl min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          {t("requestReturn")}
        </h1>
        <p className="text-muted-foreground">
          Order #{order.id.slice(0, 8).toUpperCase()} • {new Date(order.createdAt).toLocaleDateString()}
        </p>
      </div>
      
      <ReturnRequestForm order={order} />
    </div>
  );
}
