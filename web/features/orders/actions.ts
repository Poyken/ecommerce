"use server";

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

import { orderService } from "./services/order.service";

// Action đặt hàng
const safePlaceOrder = protectedActionClient
  .schema(CheckoutSchema)
  .action(async ({ parsedInput }) => {
    const res = await orderService.placeOrder(parsedInput);

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
    await orderService.cancelOrder(parsedInput.orderId);
    REVALIDATE.orders();
    return { success: true };
  });

// Action hủy đơn hàng với lý do (User action)
const safeCancelOrderWithReason = protectedActionClient
  .schema(CancelOrderWithReasonSchema)
  .action(async ({ parsedInput }) => {
    await orderService.cancelOrderWithReason(
      parsedInput.orderId,
      parsedInput.cancellationReason
    );
    REVALIDATE.orders();
    return { success: true };
  });

// Action giả lập thanh toán thành công
const safeSimulatePaymentSuccess = protectedActionClient
  .schema(SimulationSchema)
  .action(async ({ parsedInput }) => {
    await orderService.simulatePaymentSuccess(parsedInput.orderId);
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
  return wrapServerAction(
    () => orderService.getMyOrders(page, limit),
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
    () => orderService.getOrderDetails(orderId),
    "Failed to fetch order details"
  );
}
