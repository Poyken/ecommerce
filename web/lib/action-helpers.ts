import { http } from "@/lib/http";
import { ActionResult, ApiResponse } from "@/types/dtos";
import { revalidatePath, revalidateTag } from "next/cache";

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
 * 2. FETCH LIST logic:
 * - Tự động xử lý phân trang (pagination) và lọc (filtering) từ query params.
 *
 * 3. MUTATION logic (handleMutation):
 * - Tự động kích hoạt `revalidatePath` hoặc `revalidateTag`.
 * - Điều này cực kỳ quan trọng để Next.js cập nhật lại dữ liệu mới nhất trên UI sau khi thay đổi (Thêm/Sửa/Xóa).
 * =====================================================================
 */

export interface ListParams {
  page?: number;
  limit?: number;
  search?: string;
  [key: string]: string | number | boolean | undefined;
}

/**
 * Xử lý chung cho các action liệt kê dữ liệu (GET)
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
    const message =
      error instanceof Error ? error.message : "Lỗi không xác định";
    return {
      data: [] as T[],
      meta: { total: 0, page: 1, limit: 10, lastPage: 1 },
      error: message,
    };
  }
}

/**
 * Xử lý chung cho các action thay đổi dữ liệu (POST, PATCH, DELETE)
 */
export async function handleMutation<T>(
  fn: () => Promise<T>,
  options: {
    revalidatePaths?: string[];
    revalidateTags?: string[];
  } = {}
): Promise<ActionResult<T>> {
  try {
    const result = await fn();

    if (options.revalidateTags) {
      options.revalidateTags.forEach((tag) => revalidateTag(tag, "default"));
    }

    if (options.revalidatePaths) {
      options.revalidatePaths.forEach((path) => revalidatePath(path));
    }

    return { success: true, data: result };
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : "Đã có lỗi xảy ra, vui lòng thử lại sau";
    return { success: false, error: message };
  }
}
