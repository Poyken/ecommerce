"use server";

/**
 * =====================================================================
 * SAFE ACTION UTILITIES - Wrapper patterns cho next-safe-action
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. UNIFIED RESULT HANDLING:
 * - next-safe-action trả về format phức tạp: { data, serverError, validationErrors }
 * - File này cung cấp utilities để unwrap thành format đơn giản: { success, data?, error? }
 *
 * 2. COMMON PATTERNS:
 * - Hầu hết wrapper functions đều giống nhau: gọi safe action, check errors, return result
 * - Các utilities này giúp giảm code lặp lại
 * =====================================================================
 */

import { revalidatePath, revalidateTag } from "next/cache";

// =============================================================================
// TYPES
// =============================================================================

/**
 * Result type từ next-safe-action.
 */
export interface SafeActionResult<T> {
  data?: T;
  serverError?: string;
  validationErrors?: Record<string, string[] | undefined>;
}

/**
 * Simplified action result.
 */
export type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string };

// =============================================================================
// RESULT UNWRAPPERS
// =============================================================================

/**
 * Unwrap safe action result thành simplified format.
 *
 * @example
 * const result = await safeSomeAction(input);
 * return unwrapResult(result, "Failed to perform action");
 */
export function unwrapResult<T>(
  result: SafeActionResult<T> | undefined,
  defaultError = "Đã có lỗi xảy ra"
): ActionResult<T> {
  if (!result) {
    return { success: false, error: defaultError };
  }

  if (result.serverError) {
    return { success: false, error: result.serverError };
  }

  if (result.validationErrors) {
    const firstError = Object.values(result.validationErrors)
      .flat()
      .filter(Boolean)[0];
    return { success: false, error: firstError || "Validation failed" };
  }

  return { success: true, data: result.data };
}

/**
 * Check if result has error.
 */
export function hasError<T>(result: SafeActionResult<T> | undefined): boolean {
  return !!(result?.serverError || result?.validationErrors);
}

/**
 * Get error message from result.
 */
export function getErrorMessage<T>(
  result: SafeActionResult<T> | undefined,
  defaultError = "Đã có lỗi xảy ra"
): string | null {
  if (!result) return defaultError;

  if (result.serverError) return result.serverError;

  if (result.validationErrors) {
    const firstError = Object.values(result.validationErrors)
      .flat()
      .filter(Boolean)[0];
    return firstError || "Validation failed";
  }

  return null;
}

// =============================================================================
// ACTION WRAPPER FACTORY
// =============================================================================

/**
 * Tạo wrapper function cho safe action.
 * Giúp giảm boilerplate khi tạo exported action functions.
 *
 * @example
 * const safeAddToCart = protectedActionClient
 *   .schema(CartItemSchema)
 *   .action(async ({ parsedInput }) => {
 *     await http("/cart", { method: "POST", body: JSON.stringify(parsedInput) });
 *     revalidatePath("/cart");
 *     return { success: true };
 *   });
 *
 * export const addToCartAction = createActionWrapper(
 *   safeAddToCart,
 *   "Failed to add to cart"
 * );
 */
export function createActionWrapper<TInput, TOutput>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  safeAction: (input: TInput) => Promise<SafeActionResult<TOutput> | any>,
  defaultError = "Đã có lỗi xảy ra"
) {
  return async (input: TInput): Promise<ActionResult<TOutput>> => {
    try {
      const result = await safeAction(input);
      return unwrapResult(result, defaultError);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : defaultError,
      };
    }
  };
}

/**
 * Tạo wrapper không cần input.
 */
export function createVoidActionWrapper<TOutput>(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  safeAction: () => Promise<SafeActionResult<TOutput> | any>,
  defaultError = "Đã có lỗi xảy ra"
) {
  return async (): Promise<ActionResult<TOutput>> => {
    try {
      const result = await safeAction();
      return unwrapResult(result, defaultError);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : defaultError,
      };
    }
  };
}

// =============================================================================
// REVALIDATION HELPERS
// =============================================================================

/**
 * Revalidate multiple paths at once.
 */
export function revalidatePaths(...paths: string[]): void {
  paths.forEach((path) => revalidatePath(path));
}

/**
 * Revalidate multiple tags at once.
 */
export function revalidateTags(...tags: string[]): void {
  tags.forEach((tag) => revalidateTag(tag));
}

/**
 * Revalidate paths and tags together.
 */
export function revalidateAll(options: {
  paths?: string[];
  tags?: string[];
}): void {
  options.paths?.forEach((path) => revalidatePath(path));
  options.tags?.forEach((tag) => revalidateTag(tag));
}

// =============================================================================
// COMMON REVALIDATION PRESETS
// =============================================================================

/**
 * Các presets cho revalidation phổ biến.
 */
export const REVALIDATE = {
  cart: () => revalidatePath("/cart"),
  wishlist: () => revalidatePath("/wishlist"),
  orders: () => revalidatePaths("/orders", "/account/orders"),
  profile: () => revalidatePaths("/profile", "/account"),
  products: (productId?: string) => {
    revalidatePath("/shop");
    revalidatePath("/products");
    if (productId) {
      revalidatePath(`/products/${productId}`);
    }
  },
  admin: {
    products: () => revalidatePath("/admin/products"),
    orders: () => revalidatePath("/admin/orders"),
    users: () => revalidatePath("/admin/users"),
  },
} as const;
