"use server";

import { http } from "@/lib/http";
import { normalizePaginationParams } from "@/lib/utils";
import {
  REVALIDATE,
  wrapServerAction,
  createActionWrapper,
} from "@/lib/safe-action";
import { protectedActionClient } from "@/lib/safe-action";
import { CheckoutSchema } from "@/lib/schemas";
import { ApiResponse, ActionResult } from "@/types/api";
import { Order } from "@/types/models";
import { z } from "zod";

/**
 * =====================================================================
 * ORDER SERVER ACTIONS - Quản lý đơn hàng
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. SAFE ACTION CLIENT (`protectedActionClient`):
 * - Thay vì dùng `export async function...` trần trụi, ta bọc logic trong `safe-action`.
 * - Lợi ích:
 *   + Tự động validate input với Zod schema (`.schema(...)`).
 *   + Tự động handle try-catch lỗi hệ thống.
 *   + Type-safety cho input và output trả về client.
 *   + Middleware authentication đã được tích hợp sẵn (check login).
 *
 * 2. REVALIDATION:
 * - Sau khi tạo đơn hoặc hủy đơn, ta gọi `revalidatePath`.
 * - Mục đích: Xóa cache cũ của Next.js để UI cập nhật ngay lập tức (vd: giỏ hàng về 0, danh sách đơn hàng có thêm đơn mới).
 *
 * 3. SIMULATION ACTION:
 * - `simulatePaymentSuccessAction`: Chỉ dùng cho môi trường Dev/Test để giả lập việc thanh toán thành công mà không cần qua cổng thanh toán thật. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Đóng vai trò quan trọng trong kiến trúc hệ thống, hỗ trợ các chức năng nghiệp vụ cụ thể.

 * =====================================================================
 */

// --- VALIDATION SCHEMAS ---

const CancelOrderSchema = z.object({
  orderId: z.string(),
});

const CancelOrderWithReasonSchema = z.object({
  orderId: z.string(),
  cancellationReason: z.string().min(1, "Reason is required"),
});

const SimulationSchema = z.object({
  orderId: z.string(),
});

// --- SAFE ACTIONS (Internal) ---

// Action đặt hàng
const safePlaceOrder = protectedActionClient
  .schema(CheckoutSchema)
  .action(async ({ parsedInput }) => {
    const res = await http<
      ApiResponse<{
        id: string;
        paymentUrl?: string;
      }>
    >("/orders", {
      method: "POST",
      body: JSON.stringify(parsedInput),
    });

    const paymentUrl = res.data?.paymentUrl;
    const orderId = res.data?.id;

    REVALIDATE.cart();
    REVALIDATE.orders();

    return { paymentUrl, orderId };
  });

// Action hủy đơn hàng (Admin/System style)
const safeCancelOrder = protectedActionClient
  .schema(CancelOrderSchema)
  .action(async ({ parsedInput }) => {
    await http(`/orders/${parsedInput.orderId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status: "CANCELLED" }),
    });
    REVALIDATE.orders();
    return { success: true };
  });

// Action hủy đơn hàng với lý do (User action)
const safeCancelOrderWithReason = protectedActionClient
  .schema(CancelOrderWithReasonSchema)
  .action(async ({ parsedInput }) => {
    await http(`/orders/my-orders/${parsedInput.orderId}/cancel`, {
      method: "PATCH",
      body: JSON.stringify({
        cancellationReason: parsedInput.cancellationReason,
      }),
    });
    REVALIDATE.orders();
    return { success: true };
  });

// Action giả lập thanh toán thành công
const safeSimulatePaymentSuccess = protectedActionClient
  .schema(SimulationSchema)
  .action(async ({ parsedInput }) => {
    await http<ApiResponse<void>>(`/orders/${parsedInput.orderId}/status`, {
      method: "PATCH",
      body: JSON.stringify({
        status: "PROCESSING",
        paymentStatus: "PAID",
        notify: true,
      }),
    });
    REVALIDATE.orders();
    REVALIDATE.path(`/orders/${parsedInput.orderId}`, "page");
    return { success: true };
  });

// --- EXPORTS (Wrapper Functions) ---

export const placeOrderAction = createActionWrapper(
  safePlaceOrder,
  "Invalid order data"
);

export const cancelOrderAction = createActionWrapper(
  safeCancelOrder,
  "Failed to cancel order"
);

export const cancelOrderWithReasonAction = async (
  orderId: string,
  cancellationReason: string
) => {
  const wrapper = createActionWrapper(safeCancelOrderWithReason);
  return wrapper({ orderId, cancellationReason });
};

export const simulatePaymentSuccessAction = async (orderId: string) => {
  const wrapper = createActionWrapper(safeSimulatePaymentSuccess);
  return wrapper({ orderId });
};

// --- QUERY ACTIONS ---

export async function getMyOrdersAction(
  page = 1,
  limit = 10
): Promise<ActionResult<Order[]>> {
  const params = normalizePaginationParams(page, limit);
  return wrapServerAction(
    () => http<ApiResponse<Order[]>>("/orders/my-orders", { params }),
    "Failed to fetch orders"
  );
}

/**
 * Lấy chi tiết một đơn hàng của người dùng hiện tại.
 */
export async function getOrderDetailsAction(
  orderId: string
): Promise<ActionResult<Order>> {
  return wrapServerAction(
    () => http<ApiResponse<Order>>(`/orders/${orderId}`),
    "Failed to fetch order details"
  );
}
