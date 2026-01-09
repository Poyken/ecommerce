import { http } from "@/lib/http";
import { ActionResult, ApiResponse } from "@/types/dtos";
import { revalidatePath, revalidateTag } from "next/cache";
import { cookies } from "next/headers";

/**
 * =====================================================================
 * ACTION HELPERS - Tiện ích cho Server Actions
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. GIẢM BOILERPLATE:
 * - Thay vì lặp lại code fetch dữ liệu hoặc xử lý mutation ở mọi file, ta tập trung logic vào đây.
 * - Giúp code ngắn gọn, dễ bảo trì và đồng nhất cách xử lý lỗi.
 *
 * 2. CONSISTENT RESPONSE FORMAT:
 * - Tất cả actions trả về cùng một format: { success, data?, error? }
 * - Frontend dễ xử lý hơn vì biết chắc cấu trúc response.
 *
 * 3. AUTH-AWARE ACTIONS:
 * - Tự động check token trước khi gọi API
 * - Trả về response phù hợp cho guest users
 * =====================================================================
 */

// =============================================================================
// TYPES
// =============================================================================

export interface ListParams {
  page?: number;
  limit?: number;
  search?: string;
  [key: string]: string | number | boolean | undefined;
}

/**
 * Standard action result type.
 */
export type ActionResponse<T = void> =
  | { success: true; data: T }
  | { success: false; error: string; requiresAuth?: boolean };

/**
 * Action result for void operations.
 */
export type VoidActionResponse =
  | { success: true }
  | { success: false; error: string };

// =============================================================================
// ERROR HELPERS
// =============================================================================

/**
 * Extract error message từ unknown error.
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return "Đã có lỗi xảy ra, vui lòng thử lại sau";
}

/**
 * Kiểm tra xem error có phải 401 Unauthorized không.
 */
export function isUnauthorizedError(error: unknown): boolean {
  const message = getErrorMessage(error);
  return message.includes("401") || message.includes("Unauthorized");
}

// =============================================================================
// AUTH HELPERS
// =============================================================================

/**
 * Kiểm tra user đã đăng nhập chưa.
 * Dùng trước khi gọi API yêu cầu auth.
 */
export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken");
  return !!token?.value;
}

/**
 * Lấy access token từ cookies.
 */
export async function getAccessToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get("accessToken")?.value ?? null;
}

// =============================================================================
// FETCH HELPERS
// =============================================================================

/**
 * Xử lý chung cho các action liệt kê dữ liệu (GET với pagination).
 */
export async function fetchList<T>(baseUrl: string, params: ListParams) {
  try {
    const { page = 1, limit = 10, ...filters } = params;
    let url = `${baseUrl}?page=${page}&limit=${limit}`;

    Object.entries(filters).forEach(([key, value]) => {
      if (
        value !== undefined &&
        value !== null &&
        value !== "" &&
        value !== "all"
      ) {
        url += `&${key}=${encodeURIComponent(String(value))}`;
      }
    });

    return await http<ApiResponse<T[]>>(url);
  } catch (error: unknown) {
    console.error(`[Fetch] Lỗi khi lấy dữ liệu từ ${baseUrl}:`, error);
    return {
      data: [] as T[],
      meta: { total: 0, page: 1, limit: 10, lastPage: 1 },
      error: getErrorMessage(error),
    };
  }
}

/**
 * Fetch dữ liệu với auth check.
 * Nếu chưa đăng nhập, trả về giá trị mặc định thay vì gọi API.
 */
export async function fetchWithAuth<T>(
  url: string,
  defaultValue: T,
  options?: Parameters<typeof http>[1]
): Promise<T> {
  const isAuth = await isAuthenticated();
  if (!isAuth) {
    return defaultValue;
  }

  try {
    const res = await http<ApiResponse<T>>(url, {
      skipRedirectOn401: true,
      ...options,
    });
    return res?.data ?? defaultValue;
  } catch (error) {
    if (isUnauthorizedError(error)) {
      return defaultValue;
    }
    console.error(`[FetchWithAuth] Error fetching ${url}:`, error);
    return defaultValue;
  }
}

/**
 * Fetch single item by ID.
 */
export async function fetchOne<T>(
  baseUrl: string,
  id: string
): Promise<ActionResponse<T>> {
  try {
    const res = await http<ApiResponse<T>>(`${baseUrl}/${id}`);
    return { success: true, data: res.data };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

// =============================================================================
// MUTATION HELPERS
// =============================================================================

interface MutationOptions {
  revalidatePaths?: string[];
  revalidateTags?: string[];
}

/**
 * Xử lý chung cho các action thay đổi dữ liệu (POST, PATCH, DELETE).
 */
export async function handleMutation<T>(
  fn: () => Promise<T>,
  options: MutationOptions = {}
): Promise<ActionResult<T>> {
  try {
    const result = await fn();

    // Revalidate tags
    if (options.revalidateTags) {
      options.revalidateTags.forEach((tag) => revalidateTag(tag));
    }

    // Revalidate paths
    if (options.revalidatePaths) {
      options.revalidatePaths.forEach((path) => revalidatePath(path));
    }

    return { success: true, data: result };
  } catch (error: unknown) {
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Create action - POST to baseUrl.
 */
export async function createAction<TInput, TOutput = unknown>(
  baseUrl: string,
  data: TInput,
  options?: MutationOptions
): Promise<ActionResponse<TOutput>> {
  return handleMutation(async () => {
    const res = await http<ApiResponse<TOutput>>(baseUrl, {
      method: "POST",
      body: JSON.stringify(data),
    });
    return res.data;
  }, options) as Promise<ActionResponse<TOutput>>;
}

/**
 * Update action - PATCH to baseUrl/id.
 */
export async function updateAction<TInput, TOutput = unknown>(
  baseUrl: string,
  id: string,
  data: TInput,
  options?: MutationOptions
): Promise<ActionResponse<TOutput>> {
  return handleMutation(async () => {
    const res = await http<ApiResponse<TOutput>>(`${baseUrl}/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
    return res.data;
  }, options) as Promise<ActionResponse<TOutput>>;
}

/**
 * Delete action - DELETE baseUrl/id.
 */
export async function deleteAction(
  baseUrl: string,
  id: string,
  options?: MutationOptions
): Promise<VoidActionResponse> {
  try {
    await http(`${baseUrl}/${id}`, { method: "DELETE" });

    if (options?.revalidateTags) {
      options.revalidateTags.forEach((tag) => revalidateTag(tag));
    }
    if (options?.revalidatePaths) {
      options.revalidatePaths.forEach((path) => revalidatePath(path));
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

/**
 * Toggle action - Thường dùng cho wishlist, like, follow...
 */
export async function toggleAction<T = { isActive: boolean }>(
  url: string,
  data: Record<string, unknown>,
  options?: MutationOptions
): Promise<ActionResponse<T>> {
  return handleMutation(async () => {
    const res = await http<ApiResponse<T>>(url, {
      method: "POST",
      body: JSON.stringify(data),
      skipRedirectOn401: true,
    });
    return res.data;
  }, options) as Promise<ActionResponse<T>>;
}

// =============================================================================
// SAFE ACTION WRAPPER
// =============================================================================

/**
 * Wrap một action function với error handling tự động.
 * Giúp code gọn hơn và consistent error format.
 *
 * @example
 * export const getProductsAction = safeAction(async (params: ListParams) => {
 *   const res = await http<ApiResponse<Product[]>>('/products', { params });
 *   return res.data;
 * });
 */
export function safeAction<TInput, TOutput>(
  fn: (input: TInput) => Promise<TOutput>
): (input: TInput) => Promise<ActionResponse<TOutput>> {
  return async (input: TInput) => {
    try {
      const data = await fn(input);
      return { success: true, data };
    } catch (error) {
      const isUnauth = isUnauthorizedError(error);
      return {
        success: false,
        error: getErrorMessage(error),
        ...(isUnauth && { requiresAuth: true }),
      };
    }
  };
}

/**
 * Wrap action với auth check.
 * Nếu chưa đăng nhập, trả về lỗi ngay mà không gọi API.
 */
export function authAction<TInput, TOutput>(
  fn: (input: TInput) => Promise<TOutput>
): (input: TInput) => Promise<ActionResponse<TOutput>> {
  return async (input: TInput) => {
    const isAuth = await isAuthenticated();
    if (!isAuth) {
      return { success: false, error: "Unauthorized", requiresAuth: true };
    }

    try {
      const data = await fn(input);
      return { success: true, data };
    } catch (error) {
      return { success: false, error: getErrorMessage(error) };
    }
  };
}

// =============================================================================
// BATCH OPERATIONS
// =============================================================================

/**
 * Thực hiện nhiều operations song song.
 */
export async function batchOperations<T>(
  operations: Array<() => Promise<T>>
): Promise<{ results: T[]; errors: string[] }> {
  const results: T[] = [];
  const errors: string[] = [];

  const settledResults = await Promise.allSettled(operations.map((op) => op()));

  settledResults.forEach((result) => {
    if (result.status === "fulfilled") {
      results.push(result.value);
    } else {
      errors.push(getErrorMessage(result.reason));
    }
  });

  return { results, errors };
}

// =============================================================================
// VALIDATION HELPERS
// =============================================================================

/**
 * Validate input với Zod schema và wrap thành ActionResponse.
 */
export function validateInput<T>(
  schema: {
    safeParse: (data: unknown) => {
      success: boolean;
      data?: T;
      error?: { message: string };
    };
  },
  data: unknown
): { valid: true; data: T } | { valid: false; error: string } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { valid: true, data: result.data as T };
  }
  return { valid: false, error: result.error?.message || "Validation failed" };
}
