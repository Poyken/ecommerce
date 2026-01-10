import {
  createSafeActionClient,
  DEFAULT_SERVER_ERROR_MESSAGE,
} from "next-safe-action";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { getErrorMessage } from "./error-utils";
import { ApiResponse, ActionResult } from "@/types/api";

/**
 * =====================================================================
 * SAFE ACTION CLIENT - Cấu hình nòng cốt cho Server Actions
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. TRÁNH LỖI LỘ DỮ LIỆU:
 * - next-safe-action giúp đảm bảo input luôn đúng kiểu (Zod) và xử lý lỗi server tập trung.
 * - Không bao giờ trả về error stack trace cho client ở môi trường production.
 *
 * 2. AUTHENTICATION (Middleware):
 * - `protectedActionClient` sẽ tự động kiểm tra xem user đã log in chưa.
 * - Nếu chưa, nó sẽ throw lỗi "Unauthorized" ngay lập tức, giúp action chính luôn an toàn.
 *
 * 3. HỢP NHẤT UTILITIES:
 * - Cung cấp unwrapResult, createActionWrapper để giảm boilerplate ở frontend.
 * =====================================================================
 */

/**
 * Action Client cơ bản dùng cho các hành động công khai (không cần login).
 * (vd: Gửi feedback, đăng ký newsletter)
 */
export const actionClient = createSafeActionClient({
  handleServerError(e) {
    console.error("Action error:", e.message);

    if (e instanceof Error) {
      return e.message;
    }

    return DEFAULT_SERVER_ERROR_MESSAGE;
  },
});

/**
 * Protected Action Client - LUÔN yêu cầu user đã đăng nhập.
 * Nó sẽ parse cookie để lấy accessToken.
 */
export const protectedActionClient = actionClient.use(async ({ next }) => {
  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken")?.value;

  if (!token) {
    throw new Error(
      "Unauthorized: You must be logged in to perform this action."
    );
  }

  return next({ ctx: { accessToken: token } });
});

// =============================================================================
// TYPES
// =============================================================================

export interface SafeActionResult<T> {
  data?: T;
  serverError?: string;
  validationErrors?: Record<string, string[] | undefined>;
}

// =============================================================================
// RESULT UNWRAPPERS - Rút gọn kết quả cho Frontend
// =============================================================================

export function unwrapResult<T>(
  result: SafeActionResult<T> | undefined,
  defaultError = "Đã có lỗi xảy ra"
): ActionResult<T> {
  if (!result) return { success: false, error: defaultError };

  if (result.serverError || result.validationErrors) {
    let errorMsg = result.serverError;
    if (result.validationErrors) {
      const firstError = Object.values(result.validationErrors)
        .flat()
        .filter(Boolean)[0];
      errorMsg = (firstError as string) || "Validation failed";
    }
    return { success: false, error: errorMsg || defaultError };
  }

  return { success: true, data: result.data };
}

/**
 * Tạo wrapper function cho safe action để dùng trực tiếp trong Components.
 */
export function createActionWrapper<TInput, TOutput>(
  safeAction: (input: TInput) => Promise<SafeActionResult<TOutput> | any>,
  defaultError = "Đã có lỗi xảy ra"
) {
  return async (input: TInput): Promise<ActionResult<TOutput>> => {
    try {
      const result = await safeAction(input);
      return unwrapResult(result, defaultError);
    } catch (error) {
      return { success: false, error: getErrorMessage(error) || defaultError };
    }
  };
}

/**
 * Tạo wrapper function cho safe action không có input (void actions).
 * Dùng cho các action như clearCart, markAllAsRead, etc.
 */
export function createVoidActionWrapper<TOutput>(
  safeAction: () => Promise<SafeActionResult<TOutput> | any>,
  defaultError = "Đã có lỗi xảy ra"
) {
  return async (): Promise<ActionResult<TOutput>> => {
    try {
      const result = await safeAction();
      return unwrapResult(result, defaultError);
    } catch (error) {
      return { success: false, error: getErrorMessage(error) || defaultError };
    }
  };
}

/**
 * Helper to wrap standard server action logic with try-catch.
 */
export async function wrapServerAction<T>(
  action: () => Promise<T | ApiResponse<T>>,
  errorMessage: string = "An unexpected error occurred"
): Promise<ActionResult<T>> {
  try {
    const result = await action();
    if (result && typeof result === "object" && "data" in result) {
      const apiRes = result as ApiResponse<T>;
      return { success: true, data: apiRes.data, meta: apiRes.meta };
    }
    return { success: true, data: result as T };
  } catch (error: unknown) {
    console.error(`[Server Action Error] ${errorMessage}:`, error);
    return { success: false, error: getErrorMessage(error) || errorMessage };
  }
}

// =============================================================================
// REVALIDATION PRESETS
// =============================================================================

export const REVALIDATE = {
  cart: () => revalidatePath("/cart", "page"),
  orders: () => {
    revalidatePath("/orders", "page");
    revalidatePath("/admin/orders", "page");
  },
  products: (productId?: string) => {
    revalidatePath("/shop", "page");
    if (productId) revalidatePath(`/products/${productId}`, "page");
  },
  profile: () => revalidatePath("/profile", "page"),
  admin: {
    products: () => revalidatePath("/admin/products", "page"),
    orders: () => revalidatePath("/admin/orders", "page"),
    categories: () => revalidatePath("/admin/categories", "page"),
    brands: () => revalidatePath("/admin/brands", "page"),
    blogs: () => revalidatePath("/admin/blogs", "page"),
    notifications: () => revalidatePath("/admin/notifications", "page"),
  },
  superAdmin: {
    tenants: () => revalidatePath("/super-admin/tenants", "page"),
  },
  path: (path: string, type: "page" | "layout" = "page") =>
    revalidatePath(path, type),
} as const;
