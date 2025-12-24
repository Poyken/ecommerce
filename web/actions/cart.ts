"use server";

import { http } from "@/lib/http";
import { protectedActionClient } from "@/lib/safe-action";
import { CartItemSchema } from "@/lib/schemas";
import { ApiResponse } from "@/types/dtos";
import { Sku } from "@/types/models";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { z } from "zod";

/**
 * =====================================================================
 * CART SERVER ACTIONS
 * =====================================================================
 */

const UpdateCartItemSchema = z.object({
  itemId: z.string(),
  quantity: z.number().int().min(1),
});

const RemoveCartItemSchema = z.object({
  itemId: z.string(),
});

const ReorderSchema = z.object({
  orderId: z.string(),
});

const MergeCartSchema = z.array(CartItemSchema);

const GuestCartDetailsSchema = z.object({ skuIds: z.array(z.string()) });

// --- SAFE ACTIONS ---

const safeAddToCart = protectedActionClient
  .schema(CartItemSchema)
  .action(async ({ parsedInput }) => {
    try {
      await http("/cart", {
        method: "POST",
        body: JSON.stringify(parsedInput),
        skipRedirectOn401: true,
      });
      revalidatePath("/cart");
      return { success: true };
    } catch (error: unknown) {
      throw error;
    }
  });

const safeUpdateCartItem = protectedActionClient
  .schema(UpdateCartItemSchema)
  .action(async ({ parsedInput }) => {
    try {
      await http(`/cart/items/${parsedInput.itemId}`, {
        method: "PATCH",
        body: JSON.stringify({ quantity: parsedInput.quantity }),
        skipRedirectOn401: true,
      });
      revalidatePath("/cart");
      return { success: true };
    } catch (error: unknown) {
      throw error;
    }
  });

const safeRemoveFromCart = protectedActionClient
  .schema(RemoveCartItemSchema)
  .action(async ({ parsedInput }) => {
    try {
      await http(`/cart/items/${parsedInput.itemId}`, {
        method: "DELETE",
        skipRedirectOn401: true,
      });
      revalidatePath("/cart");
      return { success: true };
    } catch (error) {
      throw error;
    }
  });

const safeClearCart = protectedActionClient.action(async () => {
  try {
    await http("/cart", {
      method: "DELETE",
      skipRedirectOn401: true,
    });
    revalidatePath("/cart");
    return { success: true };
  } catch (error) {
    throw error;
  }
});

const safeReorder = protectedActionClient
  .schema(ReorderSchema)
  .action(async ({ parsedInput }) => {
    // Logic from original reorderAction
    try {
      const orderRes = await http<
        ApiResponse<{ items?: { skuId: string; quantity: number }[] }>
      >(`/orders/my-orders/${parsedInput.orderId}`);
      const order = orderRes.data;
      if (!order || !order.items) {
        throw new Error("Order not found or has no items");
      }
      const promises = order.items.map(
        (item: { skuId: string; quantity: number }) =>
          http("/cart", {
            method: "POST",
            body: JSON.stringify({
              skuId: item.skuId,
              quantity: item.quantity,
            }),
          })
      );
      await Promise.allSettled(promises);
      revalidatePath("/cart");
      return { success: true };
    } catch (error) {
      throw error;
    }
  });

const safeMergeGuestCart = protectedActionClient
  .schema(MergeCartSchema)
  .action(async ({ parsedInput }) => {
    try {
      const res = await http<unknown[]>("/cart/merge", {
        method: "POST",
        body: JSON.stringify(parsedInput),
      });
      revalidatePath("/cart");
      return { success: true, results: res };
    } catch (error) {
      throw error;
    }
  });

// --- EXPORTS (WRAPPERS) ---

export async function addToCartAction(skuId: string, quantity: number = 1) {
  const result = await safeAddToCart({ skuId, quantity });
  if (result?.serverError || result?.validationErrors) {
    return { error: result.serverError || "Validation Failed" };
  }
  return { success: true };
}

export async function updateCartItemAction(itemId: string, quantity: number) {
  const result = await safeUpdateCartItem({ itemId, quantity });
  if (result?.serverError || result?.validationErrors) {
    // Need to handle that specific "availableStock" error structure from original?
    // For now, minimal compatibility.
    return { error: result.serverError || "Failed to update item" };
  }
  return { success: true };
}

export async function removeFromCartAction(itemId: string) {
  const result = await safeRemoveFromCart({ itemId });
  if (result?.serverError) return { error: "Failed to remove item" };
  return { success: true };
}

export async function clearCartAction() {
  const result = await safeClearCart();
  if (result?.serverError) return { error: "Failed to clear cart" };
  return { success: true };
}

export async function reorderAction(orderId: string) {
  const result = await safeReorder({ orderId });
  if (result?.serverError) return { error: result.serverError };
  return { success: true };
}

export async function mergeGuestCartAction(
  items: { skuId: string; quantity: number }[]
) {
  const result = await safeMergeGuestCart(items);
  if (result?.serverError) return { success: false, error: result.serverError };
  if (result?.data) return result.data; // { success: true, results: ... }
  return { success: false, error: "Merge failed" };
}

// Read-only or Public Actions (no sensitive change)
// Guest Cart details is public (skus details) but might need protection?
// Original code didn't use user token, just fetch details.
// So we keep it plain or use public safe action if we had one.
export async function getGuestCartDetailsAction(skuIds: string[]) {
  try {
    const res = await http<ApiResponse<Sku[]>>("/products/skus/details", {
      method: "POST",
      body: JSON.stringify({ skuIds }),
    });
    const items = Array.isArray(res) ? res : res.data;
    return { success: true, data: items };
  } catch (error: unknown) {
    return {
      error: error instanceof Error ? error.message : "Không thể lấy thông tin",
    };
  }
}

export async function getCartCountAction() {
  // This is a read action, can check auth but usually harmless.
  // Original checks cookies.
  await cookies();
  try {
    const response = await http<
      ApiResponse<{
        items: { quantity: number }[];
        totalItems: number;
      }>
    >("/cart", {
      next: { revalidate: 0 },
      skipRedirectOn401: true,
    });
    const cartData = response.data || response;
    const count =
      cartData.totalItems ||
      cartData.items?.reduce(
        (acc: number, item: { quantity: number }) => acc + (item.quantity || 0),
        0
      ) ||
      0;
    return { success: true, count };
  } catch {
    return { success: false, count: 0 };
  }
}
