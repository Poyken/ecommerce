/**
 * =====================================================================
 * ADMIN SERVER ACTIONS - Chức năng quản trị Admin Dashboard
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * File này chứa TẤT CẢ Server Actions dành cho trang Admin.
 * Mỗi action tương ứng với một chức năng CRUD trong Admin Dashboard.
 *
 * CẤU TRÚC FILE:
 * - USERS: Quản lý người dùng, gán vai trò
 * - ROLES: Quản lý vai trò và phân quyền
 * - PERMISSIONS: Quản lý quyền hạn
 * - BRANDS: Quản lý thương hiệu
 * - CATEGORIES: Quản lý danh mục sản phẩm
 * - PRODUCTS: Quản lý sản phẩm
 * - SKUS: Quản lý biến thể sản phẩm
 * - ORDERS: Quản lý đơn hàng
 * - REVIEWS: Quản lý đánh giá
 *
 * NAMING CONVENTION:
 * - getXxxAction: Lấy danh sách
 * - createXxxAction: Tạo mới
 * - updateXxxAction: Cập nhật
 * - deleteXxxAction: Xóa
 *
 * ⚠️ LƯU Ý: Tất cả actions này yêu cầu quyền Admin
 * =====================================================================
 */

"use server";

import { http } from "@/lib/http";
import { getUserIdFromToken } from "@/lib/permission-utils";
import { getSession } from "@/lib/session";
import {
  ActionResult,
  AnalyticsStats,
  ApiResponse,
  CreateBrandDto,
  CreateCategoryDto,
  CreateCouponDto,
  CreateProductDto,
  CreateTenantDto,
  CreateUserDto,
  PaginatedData,
  SalesDataPoint,
  SecurityStats,
  TopProduct,
  UpdateBrandDto,
  UpdateCategoryDto,
  UpdateCouponDto,
  UpdateProductDto,
  UpdateSkuDto,
  UpdateUserDto,
} from "@/types/dtos";
import {
  Brand,
  Category,
  Coupon,
  Order,
  Permission,
  Product,
  Review,
  RoleWithPermissions,
  Sku,
  Tenant,
  Subscription,
  User,
} from "@/types/models";
import { revalidatePath, revalidateTag } from "next/cache";

/**
 * Helper chuẩn để xử lý các Server Actions trong Admin.
 * Giúp giảm boilerplate code try/catch và revalidatePath/revalidateTag.
 *
 * @param fn - Async function để thực thi
 * @param revalidatePaths - Danh sách paths cần revalidate
 * @param revalidateTags - Danh sách cache tags cần invalidate
 */
async function handleAdminAction<T>(
  fn: () => Promise<T>,
  revalidatePaths: string[] = [],
  revalidateTags: string[] = []
): Promise<ActionResult<T>> {
  try {
    const result = await fn();
    // Invalidate cache tags (for Next.js fetch cache)
    // Next.js 16 requires 2nd argument: "max" = stale-while-revalidate pattern
    revalidateTags.forEach((tag) => revalidateTag(tag, "max"));
    // Revalidate paths (for page cache)
    revalidatePaths.forEach((path) => revalidatePath(path));
    return { success: true, data: result };
  } catch (error: any) {
    // If it's a Next.js redirect error, we must re-throw it so Next.js handles it
    if (
      error?.message === "NEXT_REDIRECT" ||
      (error?.digest && error.digest.startsWith("NEXT_REDIRECT"))
    ) {
      throw error;
    }

    const message =
      error instanceof Error ? error.message : "An unknown error occurred";
    return { error: message };
  }
}

/**
 * Helper to safely unwrap paginated data from API responses.
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 * - Backend thỉnh thoảng trả về `{ data: items[] }`, thỉnh thoảng lại lồng thêm `{ data: { data: items[], meta: ... } }`.
 * - Hàm này giúp "phẳng hóa" (unwrap) dữ liệu để frontend luôn nhận được một format chuẩn nhất, tránh lỗi `undefined` khi render.
 */
function safeUnwrapApiResponse<T>(res: unknown): ApiResponse<T[]> {
  if (!res || (typeof res === "object" && "error" in res))
    return res as ApiResponse<T[]>;

  const response = res as any;

  // Handle nested paginated data: { data: { data: Entity[], meta: ... } }
  if (
    response.data &&
    typeof response.data === "object" &&
    "data" in response.data &&
    Array.isArray(response.data.data)
  ) {
    return {
      ...response,
      data: response.data.data,
      meta: response.data.meta || response.meta,
    };
  }

  // Handle case where data is already an array: { data: Entity[], meta: ... }
  if (Array.isArray(response.data)) {
    return response;
  }

  // Fallback for empty data
  if (!response.data) {
    return {
      ...response,
      data: [],
    };
  }

  return response;
}

// ============= SECURITY =============
export async function getSuperAdminWhitelistAction(): Promise<
  ActionResult<string[]>
> {
  try {
    const res = await http<string[]>("/admin/security/whitelist");
    return { success: true, data: res };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function updateSuperAdminWhitelistAction(
  ips: string[]
): Promise<ActionResult> {
  return handleAdminAction<void>(
    () =>
      http<void>("/admin/security/whitelist", {
        method: "POST",
        body: JSON.stringify({ ips }),
      }),
    ["/super-admin/security"]
  );
}

// =============================================================================
// 👥 USERS - Quản lý người dùng
// =============================================================================

// ============= USERS =============
/**
 * Lấy danh sách người dùng có phân trang và tìm kiếm.
 *
 * @param page - Trang hiện tại
 * @param limit - Số lượng user mỗi trang
 * @param search - Từ khóa tìm kiếm (email hoặc tên)
 * @param role - Lọc theo vai trò (ADMIN/USER)
 */
export async function getUsersAction(
  page = 1,
  limit = 10,
  search?: string,
  role?: string
) {
  try {
    let url = `/users?page=${page}&limit=${limit}`;
    if (search) {
      url += `&search=${encodeURIComponent(search)}`;
    }
    if (role && role !== "all") {
      url += `&role=${role}`;
    }
    const response = await http<ApiResponse<User[]>>(url);
    return safeUnwrapApiResponse<User>(response);
  } catch (error: any) {
    if (
      error?.message === "NEXT_REDIRECT" ||
      (error?.digest && error.digest.startsWith("NEXT_REDIRECT"))
    ) {
      throw error;
    }
    console.error("getUsersAction error:", error);
    return { error: (error as Error).message };
  }
}

/**
 * Tạo người dùng mới từ trang quản trị.
 *
 * @param data - Dữ liệu user (email, password, name)
 */
export async function createUserAction(
  data: CreateUserDto
): Promise<ActionResult> {
  return handleAdminAction<void>(
    () => http<void>("/users", { method: "POST", body: JSON.stringify(data) }),
    ["/admin/users"]
  );
}

/**
 * Cập nhật thông tin người dùng.
 *
 * @param userId - ID của user cần sửa
 * @param data - Dữ liệu cập nhật
 */
export async function updateUserAction(
  userId: string,
  data: UpdateUserDto
): Promise<ActionResult> {
  return handleAdminAction<void>(
    () =>
      http<void>(`/users/${userId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    ["/admin/users"]
  );
}

/**
 * Xóa người dùng khỏi hệ thống.
 */
export async function deleteUserAction(userId: string): Promise<ActionResult> {
  const token = await getSession();
  const currentUserId = getUserIdFromToken(token);

  if (currentUserId === userId) {
    return { error: "You cannot delete your own account." };
  }

  return handleAdminAction<void>(
    () => http<void>(`/users/${userId}`, { method: "DELETE" }),
    ["/admin/users"]
  );
}

/**
 * Gán vai trò (roles) cho người dùng.
 *
 * @param userId - ID người dùng
 * @param roleIds - Danh sách ID các vai trò muốn gán
 */
export async function assignRolesAction(
  userId: string,
  roleIds: string[]
): Promise<ActionResult> {
  const token = await getSession();
  const currentUserId = getUserIdFromToken(token);

  if (currentUserId === userId) {
    return { error: "You cannot change your own roles." };
  }

  return handleAdminAction<void>(
    () =>
      http<void>(`/users/${userId}/roles`, {
        method: "POST",
        body: JSON.stringify({ roles: roleIds }),
      }),
    ["/admin/users"]
  );
}

// ============= ROLES =============
/**
 * Lấy danh sách vai trò (Roles).
 */
export async function getRolesAction(page = 1, limit = 100, search?: string) {
  try {
    let url = `/roles?page=${page}&limit=${limit}`;
    if (search) {
      url += `&search=${encodeURIComponent(search)}`;
    }
    const res = await http<ApiResponse<RoleWithPermissions[]>>(url);
    return safeUnwrapApiResponse<RoleWithPermissions>(res);
  } catch (error: any) {
    if (
      error?.message === "NEXT_REDIRECT" ||
      (error?.digest && error.digest.startsWith("NEXT_REDIRECT"))
    ) {
      throw error;
    }
    return { error: (error as Error).message };
  }
}

export async function createRoleAction(name: string): Promise<ActionResult> {
  return handleAdminAction<void>(
    () =>
      http<void>("/roles", { method: "POST", body: JSON.stringify({ name }) }),
    ["/admin/roles"]
  );
}

export async function updateRoleAction(
  roleId: string,
  name: string
): Promise<ActionResult> {
  return handleAdminAction<void>(
    () =>
      http<void>(`/roles/${roleId}`, {
        method: "PATCH",
        body: JSON.stringify({ name }),
      }),
    ["/admin/roles"]
  );
}

export async function deleteRoleAction(roleId: string): Promise<ActionResult> {
  return handleAdminAction<void>(
    () => http<void>(`/roles/${roleId}`, { method: "DELETE" }),
    ["/admin/roles"]
  );
}

export async function assignPermissionsAction(
  roleId: string,
  permissionIds: string[]
): Promise<ActionResult> {
  return handleAdminAction<void>(
    () =>
      http<void>(`/roles/${roleId}/permissions`, {
        method: "POST",
        body: JSON.stringify({ permissions: permissionIds }),
      }),
    ["/admin/roles"]
  );
}

// ============= PERMISSIONS =============
/**
 * Lấy danh sách tất cả các quyền (Permissions) có trong hệ thống.
 */
export async function getPermissionsAction() {
  try {
    const res = await http<ApiResponse<Permission[]>>("/roles/permissions");
    return safeUnwrapApiResponse<Permission>(res);
  } catch (error: any) {
    if (
      error?.message === "NEXT_REDIRECT" ||
      (error?.digest && error.digest.startsWith("NEXT_REDIRECT"))
    ) {
      throw error;
    }
    return { error: (error as Error).message };
  }
}

export async function createPermissionAction(
  name: string
): Promise<ActionResult> {
  return handleAdminAction<void>(
    () =>
      http<void>("/roles/permissions", {
        method: "POST",
        body: JSON.stringify({ name }),
      }),
    ["/admin/permissions"]
  );
}

export async function updatePermissionAction(
  permissionId: string,
  name: string
): Promise<ActionResult> {
  return handleAdminAction<void>(
    () =>
      http<void>(`/roles/permissions/${permissionId}`, {
        method: "PATCH",
        body: JSON.stringify({ name }),
      }),
    ["/admin/permissions"]
  );
}

export async function deletePermissionAction(
  permissionId: string
): Promise<ActionResult> {
  return handleAdminAction<void>(
    () =>
      http<void>(`/roles/permissions/${permissionId}`, { method: "DELETE" }),
    ["/admin/permissions"]
  );
}

// ============= BRANDS =============
/**
 * Lấy danh sách thương hiệu.
 */
export async function getBrandsAction(page = 1, limit = 100, search?: string) {
  try {
    let url = `/brands?page=${page}&limit=${limit}`;
    if (search) {
      url += `&search=${encodeURIComponent(search)}`;
    }
    const res = await http<ApiResponse<Brand[]>>(url);
    return safeUnwrapApiResponse<Brand>(res);
  } catch (error: unknown) {
    return { error: (error as Error).message };
  }
}

/**
 * Tạo thương hiệu mới.
 * Hỗ trợ cả JSON DTO và FormData (để upload ảnh).
 */
export async function createBrandAction(
  data: CreateBrandDto | FormData
): Promise<ActionResult> {
  const isFormData = data instanceof FormData;
  return handleAdminAction<void>(
    () =>
      http<void>("/brands", {
        method: "POST",
        body: isFormData ? data : JSON.stringify(data),
      }),
    ["/admin/brands"]
  );
}

/**
 * Cập nhật thông tin thương hiệu.
 */
export async function updateBrandAction(
  brandId: string,
  data: UpdateBrandDto | FormData
): Promise<ActionResult> {
  const isFormData = data instanceof FormData;
  return handleAdminAction<void>(
    () =>
      http<void>(`/brands/${brandId}`, {
        method: "PATCH",
        body: isFormData ? data : JSON.stringify(data),
      }),
    ["/admin/brands"]
  );
}

/**
 * Xóa thương hiệu.
 */
export async function deleteBrandAction(
  brandId: string
): Promise<ActionResult> {
  return handleAdminAction<void>(
    () => http<void>(`/brands/${brandId}`, { method: "DELETE" }),
    ["/admin/brands"]
  );
}

// ============= CATEGORIES =============
/**
 * Lấy danh sách danh mục sản phẩm.
 */
export async function getCategoriesAction(
  page = 1,
  limit = 100,
  search?: string
) {
  try {
    let url = `/categories?page=${page}&limit=${limit}`;
    if (search) {
      url += `&search=${encodeURIComponent(search)}`;
    }
    const res = await http<ApiResponse<Category[]>>(url);
    return safeUnwrapApiResponse<Category>(res);
  } catch (error: unknown) {
    return { error: (error as Error).message };
  }
}

/**
 * Tạo danh mục mới.
 */
export async function createCategoryAction(
  data: CreateCategoryDto | FormData
): Promise<ActionResult> {
  const isFormData = data instanceof FormData;
  return handleAdminAction<void>(
    () =>
      http<void>("/categories", {
        method: "POST",
        body: isFormData ? data : JSON.stringify(data),
      }),
    ["/admin/categories"]
  );
}

/**
 * Cập nhật danh mục.
 */
export async function updateCategoryAction(
  categoryId: string,
  data: UpdateCategoryDto | FormData
): Promise<ActionResult> {
  const isFormData = data instanceof FormData;
  return handleAdminAction<void>(
    () =>
      http<void>(`/categories/${categoryId}`, {
        method: "PATCH",
        body: isFormData ? data : JSON.stringify(data),
      }),
    ["/admin/categories"]
  );
}

/**
 * Xóa danh mục.
 */
export async function deleteCategoryAction(
  categoryId: string
): Promise<ActionResult> {
  return handleAdminAction<void>(
    () => http<void>(`/categories/${categoryId}`, { method: "DELETE" }),
    ["/admin/categories"]
  );
}

// ============= PRODUCTS =============
/**
 * Lấy danh sách sản phẩm (Product entities).
 */
export async function getProductsAction(page = 1, limit = 10, search?: string) {
  try {
    let url = `/products?page=${page}&limit=${limit}`;
    if (search) {
      url += `&search=${encodeURIComponent(search)}`;
    }
    const res = await http<ApiResponse<Product[]>>(url);
    return safeUnwrapApiResponse<Product>(res);
  } catch (error: unknown) {
    return { error: (error as Error).message };
  }
}

export async function createProductAction(
  data: CreateProductDto
): Promise<ActionResult> {
  return handleAdminAction<void>(
    () =>
      http<void>("/products", { method: "POST", body: JSON.stringify(data) }),
    ["/admin/products", "/shop"],
    ["products"]
  );
}

export async function updateProductAction(
  productId: string,
  data: UpdateProductDto
): Promise<ActionResult> {
  return handleAdminAction<void>(
    () =>
      http<void>(`/products/${productId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    ["/admin/products", "/shop"],
    ["products", `product-${productId}`]
  );
}

export async function deleteProductAction(
  productId: string
): Promise<ActionResult> {
  return handleAdminAction<void>(
    () => http<void>(`/products/${productId}`, { method: "DELETE" }),
    ["/admin/products", "/shop"],
    ["products", `product-${productId}`]
  );
}

// ============= SKUS =============
/**
 * Lấy danh sách tất cả SKUs (biến thể sản phẩm) với các bộ lọc.
 *
 * @param page - Trang hiện tại
 * @param limit - Số lượng mỗi trang
 * @param status - Lọc theo trạng thái (ACTIVE/INACTIVE)
 * @param search - Tìm kiếm theo mã SKU
 * @param stockLimit - Lọc các SKU có tồn kho thấp hơn mức này (cảnh báo hết hàng)
 */
export async function getSkusAction(
  page = 1,
  limit = 10,
  status?: string,
  search?: string,
  stockLimit?: number
) {
  try {
    let url = `/skus?page=${page}&limit=${limit}`;
    if (status) {
      url += `&status=${status}`;
    }
    if (search) {
      url += `&search=${encodeURIComponent(search)}`;
    }
    if (stockLimit !== undefined) {
      url += `&stockLimit=${stockLimit}`;
    }
    const res = await http<ApiResponse<Sku[]>>(url);
    return safeUnwrapApiResponse<Sku>(res);
  } catch (error: unknown) {
    return { error: (error as Error).message };
  }
}

// createSkuAction removed as SKUs are auto-generated

export async function updateSkuAction(
  skuId: string,
  data: UpdateSkuDto | FormData
): Promise<ActionResult> {
  const isFormData = data instanceof FormData;
  return handleAdminAction<void>(
    () =>
      http<void>(`/skus/${skuId}`, {
        method: "PATCH",
        body: isFormData ? data : JSON.stringify(data),
      }),
    ["/admin/skus"]
  );
}

export async function deleteSkuAction(skuId: string): Promise<ActionResult> {
  return handleAdminAction<void>(
    () => http<void>(`/skus/${skuId}`, { method: "DELETE" }),
    ["/admin/skus"]
  );
}

// ============= ORDERS =============
/**
 * Lấy danh sách đơn hàng cho admin.
 */
export async function getOrdersAction(
  page = 1,
  limit = 10,
  search?: string,
  status?: string
) {
  try {
    let url = `/orders?page=${page}&limit=${limit}`;
    if (search) {
      url += `&search=${encodeURIComponent(search)}`;
    }
    if (status && status !== "all") {
      url += `&status=${status.toUpperCase()}`;
    }
    const res = await http<ApiResponse<Order[]>>(url);
    return safeUnwrapApiResponse<Order>(res);
  } catch (error: unknown) {
    return { error: (error as Error).message };
  }
}

export async function updateOrderStatusAction(
  orderId: string,
  status: string,
  notify = true,
  cancellationReason?: string
): Promise<ActionResult> {
  return handleAdminAction<void>(
    () =>
      http<void>(`/orders/${orderId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status, notify, cancellationReason }),
      }),
    ["/admin/orders"]
  );
}

/**
 * Lấy chi tiết một đơn hàng.
 */
export async function getOrderDetailsAction(orderId: string) {
  try {
    const res = await http<ApiResponse<Order>>(`/orders/${orderId}`);
    return { data: res.data };
  } catch (error: unknown) {
    return { error: (error as Error).message };
  }
}

// ============= COUPONS =============
/**
 * Lấy danh sách tất cả mã giảm giá (Coupons).
 */
export async function getCouponsAction(page = 1, limit = 10, search?: string) {
  try {
    let url = `/coupons?page=${page}&limit=${limit}`;
    if (search) {
      url += `&search=${encodeURIComponent(search)}`;
    }
    const res = await http<ApiResponse<Coupon[]>>(url);
    return safeUnwrapApiResponse<Coupon>(res);
  } catch (error: unknown) {
    return { error: (error as Error).message };
  }
}

export async function createCouponAction(
  data: CreateCouponDto
): Promise<ActionResult> {
  return handleAdminAction<void>(
    () =>
      http<void>("/coupons", { method: "POST", body: JSON.stringify(data) }),
    ["/admin/coupons"]
  );
}

export async function updateCouponAction(
  couponId: string,
  data: UpdateCouponDto
): Promise<ActionResult> {
  return handleAdminAction<void>(
    () =>
      http<void>(`/coupons/${couponId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    ["/admin/coupons"]
  );
}

export async function deleteCouponAction(
  couponId: string
): Promise<ActionResult> {
  return handleAdminAction<void>(
    () => http<void>(`/coupons/${couponId}`, { method: "DELETE" }),
    ["/admin/coupons"]
  );
}

// ============= ANALYTICS =============
/**
 * Lấy các chỉ số thống kê tổng quan (Dashboard stats).
 */
export async function getAnalyticsStatsAction() {
  try {
    const res = await http<ApiResponse<AnalyticsStats>>("/analytics/stats");
    return { data: res.data };
  } catch (error: unknown) {
    return { error: (error as Error).message };
  }
}

/**
 * Lấy dữ liệu doanh thu theo thời gian để vẽ biểu đồ.
 *
 * @param days - Số ngày gần nhất muốn lấy dữ liệu
 */
export async function getSalesDataAction(days = 30) {
  try {
    const res = await http<ApiResponse<SalesDataPoint[]>>(
      `/analytics/sales?days=${days}`
    );
    return { data: res.data };
  } catch (error: unknown) {
    return { error: (error as Error).message };
  }
}

/**
 * Lấy danh sách các sản phẩm bán chạy nhất.
 */
export async function getTopProductsAction(limit = 5) {
  try {
    const res = await http<ApiResponse<TopProduct[]>>(
      `/analytics/top-products?limit=${limit}`
    );
    return { data: res.data };
  } catch (error: unknown) {
    return { error: (error as Error).message };
  }
}

// =============================================================================
// ⭐ REVIEWS - Quản lý đánh giá
// =============================================================================

/**
 * Lấy danh sách đánh giá có phân trang và lọc theo rating.
 */
export async function getReviewsAction(
  page = 1,
  limit = 10,
  search?: string,
  status?: string
) {
  try {
    let url = `/reviews?page=${page}&limit=${limit}`;
    if (search) {
      url += `&search=${encodeURIComponent(search)}`;
    }
    if (status && status !== "all") {
      url += `&status=${status}`;
    }
    const response = await http<ApiResponse<Review[]>>(url);
    return safeUnwrapApiResponse<Review>(response);
  } catch (error: unknown) {
    console.error("getReviewsAction error:", error);
    return { error: (error as Error).message };
  }
}

export async function updateReviewAction(
  reviewId: string,
  data: { comment?: string; rating?: number; isPublished?: boolean }
): Promise<ActionResult> {
  return handleAdminAction<void>(
    () =>
      http<void>(`/reviews/${reviewId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    ["/admin/reviews"],
    ["reviews"]
  );
}

export async function toggleReviewStatusAction(
  id: string,
  isApproved: boolean
) {
  return handleAdminAction<void>(
    async () => {
      return http(`/reviews/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ isApproved }),
      });
    },
    ["/admin/reviews"],
    ["reviews"]
  );
}

/**
 * Xóa đánh giá vĩnh viễn.
 */
export async function deleteReviewAction(
  reviewId: string
): Promise<ActionResult> {
  try {
    await http(`/reviews/${reviewId}`, { method: "DELETE" });
    revalidatePath("/admin/reviews");
    return { success: true };
  } catch (error: unknown) {
    return { error: (error as Error).message };
  }
}

/**
 * Trả lời đánh giá.
 */
export async function replyToReviewAction(
  reviewId: string,
  reply: string
): Promise<ActionResult> {
  try {
    await http(`/reviews/${reviewId}/reply`, {
      method: "POST",
      body: JSON.stringify({ reply }),
    });
    revalidatePath("/admin/reviews");
    return { success: true };
  } catch (error: unknown) {
    return { error: (error as Error).message };
  }
}

/**
 * Lấy danh sách nhật ký hoạt động (Audit Logs).
 */
export async function getAuditLogsAction(
  page = 1,
  limit = 20,
  search?: string,
  action?: string
) {
  try {
    let url = `/audit?page=${page}&limit=${limit}`;
    if (search) {
      url += `&search=${encodeURIComponent(search)}`;
    }
    if (action && action !== "all") {
      url += `&action=${action}`;
    }
    const response = await http<ApiResponse<unknown[]>>(url);
    return response;
  } catch (error: any) {
    if (
      error?.message === "NEXT_REDIRECT" ||
      (error?.digest && error.digest.startsWith("NEXT_REDIRECT"))
    ) {
      throw error;
    }
    console.error("getAuditLogsAction error:", error);
    return { error: error instanceof Error ? error.message : "Unknown error" };
  }
}

/**
 * Lấy các bản dịch của một sản phẩm.
 */
export async function getProductTranslationsAction(productId: string) {
  try {
    const response = await http<ApiResponse<unknown[]>>(
      `/products/${productId}/translations`
    );
    return response;
  } catch (error: unknown) {
    return { error: error instanceof Error ? error.message : "Unknown error" };
  }
}

/**
 * Cập nhật/Tạo bản dịch cho sản phẩm.
 */
export async function updateProductTranslationAction(
  productId: string,
  data: { locale: string; name: string; description?: string }
): Promise<ActionResult> {
  return handleAdminAction<void>(
    () =>
      http<void>(`/products/${productId}/translations`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    ["/admin/products"]
  );
}

// =====================================================================
// INVOICE ACTIONS
// =====================================================================

/**
 * Lấy dữ liệu hóa đơn của một đơn hàng.
 */
export async function getInvoiceDataAction(orderId: string) {
  try {
    const response = await http<unknown>(`/orders/${orderId}/invoice`);
    return response;
  } catch (error: unknown) {
    return { error: error instanceof Error ? error.message : "Unknown error" };
  }
}

// =====================================================================
// BULK OPERATIONS ACTIONS
// =====================================================================

/**
 * Xuất danh sách SKU ra JSON.
 */
export async function exportSkusAction() {
  try {
    const response = await http<ApiResponse<unknown[]>>(
      `/admin/bulk/export/skus/json`
    );
    return response;
  } catch (error: unknown) {
    return { error: error instanceof Error ? error.message : "Unknown error" };
  }
}

interface ImportSkusResult {
  success: number;
  failed: number;
  errors: unknown[];
}

/**
 * Nhập dữ liệu SKU từ JSON.
 */
export async function importSkusAction(
  rows: {
    skuCode: string;
    price?: number;
    salePrice?: number;
    stock?: number;
    status?: string;
  }[]
): Promise<ActionResult & { result?: ImportSkusResult }> {
  return handleAdminAction(async () => {
    const response = await http<ImportSkusResult>(`/admin/bulk/import/skus`, {
      method: "POST",
      body: JSON.stringify({ rows }),
    });
    return { result: response };
  }, ["/admin/skus"]).then((res) => {
    if (res.success && res.data) {
      return { success: true, ...res.data };
    }
    return res as ActionResult & { result?: ImportSkusResult };
  });
}

/**
 * Cập nhật giá/tồn kho hàng loạt.
 */
export async function bulkUpdateSkusAction(data: {
  skuIds: string[];
  priceChange?: { type: "fixed" | "percentage"; value: number };
  stockChange?: { type: "set" | "add" | "subtract"; value: number };
}): Promise<ActionResult & { updated?: number }> {
  return handleAdminAction(async () => {
    const response = await http<{ updated: number }>(`/admin/bulk/update`, {
      method: "POST",
      body: JSON.stringify(data),
    });
    return { updated: response.updated };
  }, ["/admin/skus"]).then((res) => {
    if (res.success && res.data) {
      return { success: true, ...res.data };
    }
    return res as ActionResult & { updated?: number };
  });
}

// =====================================================================
// ANALYTICS ACTIONS
// =====================================================================

export async function getDashboardStatsAction(
  startDate?: string,
  endDate?: string
) {
  try {
    let url = "/analytics/stats";
    const params = new URLSearchParams();
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);
    if (params.toString()) url += `?${params.toString()}`;

    const stats = await http<unknown>(url);

    // Get sales data
    let salesUrl = "/analytics/sales";
    if (params.toString()) salesUrl += `?${params.toString()}`;
    const salesData = await http<unknown>(salesUrl);

    // Get top products
    let topUrl = "/analytics/top-products?limit=5";
    if (params.toString()) topUrl += `&${params.toString()}`;
    const topProducts = await http<unknown>(topUrl);

    return { ...(stats as object), salesData, topProducts };
  } catch (error: unknown) {
    return { error: error instanceof Error ? error.message : "Unknown error" };
  }
}

export async function getInventoryAnalysisAction() {
  try {
    const response = await http<unknown>("/analytics/inventory");
    return response;
  } catch (error: unknown) {
    return { error: error instanceof Error ? error.message : "Unknown error" };
  }
}
// =============================================================================
// 📝 BLOGS - Quản lý bài viết
// =============================================================================

export async function getBlogStatsAction() {
  try {
    const res = await http<ApiResponse<any[]>>("/blogs?limit=1000");
    const blogs = res.data || [];
    return {
      success: true,
      data: {
        total: blogs.length,
        published: blogs.filter((b: any) => b.publishedAt).length,
        drafts: blogs.filter((b: any) => !b.publishedAt).length,
      },
    };
  } catch (error: unknown) {
    return { error: (error as Error).message };
  }
}

// =============================================================================
// 📄 PAGES - Quản lý trang động (CMS)
// =============================================================================

export async function getPagesAction() {
  try {
    const res = await http<ApiResponse<any[]>>("/pages/admin/list");
    return safeUnwrapApiResponse<any>(res);
  } catch (error: unknown) {
    return { error: (error as Error).message };
  }
}

export async function getPageByIdAction(id: string) {
  try {
    const res = await http<ApiResponse<any>>(`/pages/admin/${id}`);
    return { data: res.data };
  } catch (error: unknown) {
    return { error: (error as Error).message };
  }
}

export async function createPageAction(data: any): Promise<ActionResult<any>> {
  return handleAdminAction<any>(async () => {
    const res = await http<any>("/pages/admin", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return res.data || res;
  }, ["/admin/pages", "/"]);
}

export async function updatePageAction(
  id: string,
  data: any
): Promise<ActionResult> {
  return handleAdminAction<void>(
    () =>
      http<void>(`/pages/admin/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    ["/admin/pages", "/", `page-${id}`]
  );
}

export async function deletePageAction(id: string): Promise<ActionResult> {
  return handleAdminAction<void>(
    () => http<void>(`/pages/admin/${id}`, { method: "DELETE" }),
    ["/admin/pages", "/"]
  );
}

// =============================================================================
// TENANTS MANAGEMENT (SUPER ADMIN)
// =============================================================================

export async function getTenantsAction(): Promise<
  ActionResult<PaginatedData<Tenant>>
> {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");

  return handleAdminAction(async () => {
    // API might return ApiResponse<Tenant[]> or direct Tenant[]
    const res = await http<any>("/tenants", {
      next: { tags: ["tenants"] },
    });

    // Use safe unwrapping logic
    const tenants = Array.isArray(res)
      ? res
      : res?.data?.data || res?.data || [];
    const meta = res?.meta ||
      res?.data?.meta || {
        total: tenants.length,
        page: 1,
        lastPage: 1,
        limit: 100,
      };

    return {
      data: tenants,
      meta: meta,
    };
  });
}

export async function createTenantAction(
  data: CreateTenantDto
): Promise<ActionResult<Tenant>> {
  const session = await getSession();
  if (!session) return { error: "Unauthorized" };

  return handleAdminAction(
    async () => {
      // Must stringify body
      return http<Tenant>("/tenants", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    ["/super-admin/tenants"],
    ["tenants"]
  );
}

export async function updateTenantAction(
  id: string,
  data: Partial<CreateTenantDto>
): Promise<ActionResult<Tenant>> {
  const session = await getSession();
  if (!session) return { error: "Unauthorized" };

  return handleAdminAction(
    async () => {
      return http<Tenant>(`/tenants/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
    },
    ["/super-admin/tenants", `/super-admin/tenants/${id}`],
    ["tenants"]
  );
}

export async function deleteTenantAction(
  id: string
): Promise<ActionResult<void>> {
  const session = await getSession();
  if (!session) return { error: "Unauthorized" };

  return handleAdminAction(
    async () => {
      await http(`/tenants/${id}`, {
        method: "DELETE",
      });
    },
    ["/admin/tenants"],
    ["tenants"]
  );
}

export async function getTenantAction(
  id: string
): Promise<ActionResult<Tenant>> {
  const session = await getSession();
  if (!session) return { error: "Unauthorized" };

  try {
    const res = await http<Tenant>(`/tenants/${id}`);
    return { data: res };
  } catch (e) {
    return { error: (e as Error).message };
  }
}
// =============================================================================
// 🔒 SECURITY HUB ACTIONS (SUPER ADMIN)
// =============================================================================

/**
 * Lấy các chỉ số an ninh hệ thống.
 */
export async function getSecurityStatsAction(): Promise<
  ActionResult<SecurityStats>
> {
  try {
    const res = await http<ApiResponse<SecurityStats>>("/admin/security/stats");
    return { success: true, data: res.data };
  } catch (error: any) {
    return { error: error.message };
  }
}

/**
 * Lấy trạng thái khóa hệ thống hiện tại.
 */
export async function getLockdownStatusAction(): Promise<
  ActionResult<{ isEnabled: boolean }>
> {
  try {
    const res = await http<ApiResponse<{ isEnabled: boolean }>>(
      "/admin/security/lockdown-status"
    );
    return { success: true, data: res.data };
  } catch (error: any) {
    return { error: error.message };
  }
}

/**
 * Bật/Tắt chế độ khóa hệ thống khẩn cấp.
 */
export async function toggleLockdownAction(
  isEnabled: boolean
): Promise<ActionResult> {
  return handleAdminAction(
    () =>
      http("/admin/security/lockdown", {
        method: "POST",
        body: JSON.stringify({ isEnabled }),
      }),
    ["/super-admin/security"]
  );
}

// ============= AI AUTOMATION =============
export async function generateProductContentAction(data: {
  productName: string;
  categoryName: string;
  brandName?: string;
  features?: string[];
}): Promise<
  ActionResult<{
    description: string;
    metaTitle: string;
    metaDescription: string;
    metaKeywords: string;
  }>
> {
  try {
    const res = await http<
      ApiResponse<{
        description: string;
        metaTitle: string;
        metaDescription: string;
        metaKeywords: string;
      }>
    >("/ai-automation/generate-product-content", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return { success: true, data: res.data };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function translateTextAction(data: {
  text: string;
  targetLocale: string;
}): Promise<ActionResult<{ text: string; locale: string }>> {
  try {
    const res = await http<
      ApiResponse<{
        text: string;
        locale: string;
      }>
    >("/ai-automation/translate", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return { success: true, data: res.data };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function analyzeReviewSentimentAction(
  text: string
): Promise<ActionResult<{ sentiment: string; tags: string[] }>> {
  try {
    const res = await http<
      ApiResponse<{
        sentiment: string;
        tags: string[];
      }>
    >("/ai-automation/analyze-review-sentiment", {
      method: "POST",
      body: JSON.stringify({ text }),
    });
    return { success: true, data: res.data };
  } catch (error: any) {
    return { error: error.message };
  }
}

// =============================================================================
// 📅 SUBSCRIPTIONS ACTIONS (SUPER ADMIN)
// =============================================================================

export async function getSubscriptionsAction(params: {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
}): Promise<ActionResult<PaginatedData<Subscription>>> {
  const query = new URLSearchParams();
  if (params.page) query.set("page", params.page.toString());
  if (params.limit) query.set("limit", params.limit.toString());
  if (params.search) query.set("search", params.search);
  if (params.status) query.set("status", params.status);

  try {
    const res = await http<PaginatedData<Subscription>>(
      `/subscriptions?${query.toString()}`,
      { next: { tags: ["subscriptions"] } }
    );
    return { success: true, data: res };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function cancelSubscriptionAction(
  tenantId: string
): Promise<ActionResult<any>> {
  return handleAdminAction(
    () =>
      http(`/subscriptions/${tenantId}/cancel`, {
        method: "POST",
      }),
    ["/super-admin/subscriptions"],
    ["subscriptions"]
  );
}
