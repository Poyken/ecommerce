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
  CreateUserDto,
  SalesDataPoint,
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
  Role,
  Sku,
  User,
} from "@/types/models";
import { revalidatePath } from "next/cache";

/**
 * Helper chuẩn để xử lý các Server Actions trong Admin.
 * Giúp giảm boilerplate code try/catch và revalidatePath.
 */
async function handleAdminAction<T>(
  fn: () => Promise<T>,
  revalidatePaths: string[] = []
): Promise<ActionResult<T>> {
  try {
    const result = await fn();
    revalidatePaths.forEach((path) => revalidatePath(path));
    return { success: true, data: result };
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "An unknown error occurred";
    return { error: message };
  }
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
 */
export async function getUsersAction(page = 1, limit = 10, search?: string) {
  try {
    let url = `/users?page=${page}&limit=${limit}`;
    if (search) {
      url += `&search=${encodeURIComponent(search)}`;
    }
    const response = await http<ApiResponse<User[]>>(url);
    return response;
  } catch (error: unknown) {
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
  return handleAdminAction(
    () => http("/users", { method: "POST", body: JSON.stringify(data) }),
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
  return handleAdminAction(
    () =>
      http(`/users/${userId}`, { method: "PATCH", body: JSON.stringify(data) }),
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

  return handleAdminAction(
    () => http(`/users/${userId}`, { method: "DELETE" }),
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

  return handleAdminAction(
    () =>
      http(`/users/${userId}/roles`, {
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
    const res = await http<ApiResponse<Role[]>>(url);
    return { data: res.data };
  } catch (error: unknown) {
    return { error: (error as Error).message };
  }
}

export async function createRoleAction(name: string): Promise<ActionResult> {
  return handleAdminAction(
    () => http("/roles", { method: "POST", body: JSON.stringify({ name }) }),
    ["/admin/roles"]
  );
}

export async function updateRoleAction(
  roleId: string,
  name: string
): Promise<ActionResult> {
  return handleAdminAction(
    () =>
      http(`/roles/${roleId}`, {
        method: "PATCH",
        body: JSON.stringify({ name }),
      }),
    ["/admin/roles"]
  );
}

export async function deleteRoleAction(roleId: string): Promise<ActionResult> {
  return handleAdminAction(
    () => http(`/roles/${roleId}`, { method: "DELETE" }),
    ["/admin/roles"]
  );
}

export async function assignPermissionsAction(
  roleId: string,
  permissionIds: string[]
): Promise<ActionResult> {
  return handleAdminAction(
    () =>
      http(`/roles/${roleId}/permissions`, {
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
    return { data: res.data };
  } catch (error: unknown) {
    return { error: (error as Error).message };
  }
}

export async function createPermissionAction(
  name: string
): Promise<ActionResult> {
  return handleAdminAction(
    () =>
      http("/roles/permissions", {
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
  return handleAdminAction(
    () =>
      http(`/roles/permissions/${permissionId}`, {
        method: "PATCH",
        body: JSON.stringify({ name }),
      }),
    ["/admin/permissions"]
  );
}

export async function deletePermissionAction(
  permissionId: string
): Promise<ActionResult> {
  return handleAdminAction(
    () => http(`/roles/permissions/${permissionId}`, { method: "DELETE" }),
    ["/admin/permissions"]
  );
}

// ============= BRANDS =============
/**
 * Lấy danh sách thương hiệu.
 */
export async function getBrandsAction(search?: string) {
  try {
    let url = `/brands`;
    if (search) {
      url += `?search=${encodeURIComponent(search)}`;
    }
    const res = await http<ApiResponse<Brand[]>>(url);
    return { data: res.data };
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
  return handleAdminAction(
    () =>
      http("/brands", {
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
  return handleAdminAction(
    () =>
      http(`/brands/${brandId}`, {
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
  return handleAdminAction(
    () => http(`/brands/${brandId}`, { method: "DELETE" }),
    ["/admin/brands"]
  );
}

// ============= CATEGORIES =============
/**
 * Lấy danh sách danh mục sản phẩm.
 */
export async function getCategoriesAction(search?: string) {
  try {
    let url = `/categories`;
    if (search) {
      url += `?search=${encodeURIComponent(search)}`;
    }
    const res = await http<ApiResponse<Category[]>>(url);
    return { data: res.data };
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
  return handleAdminAction(
    () =>
      http("/categories", {
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
  return handleAdminAction(
    () =>
      http(`/categories/${categoryId}`, {
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
  return handleAdminAction(
    () => http(`/categories/${categoryId}`, { method: "DELETE" }),
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
    return res;
  } catch (error: unknown) {
    return { error: (error as Error).message };
  }
}

export async function createProductAction(
  data: CreateProductDto
): Promise<ActionResult> {
  return handleAdminAction(
    () => http("/products", { method: "POST", body: JSON.stringify(data) }),
    ["/admin/products"]
  );
}

export async function updateProductAction(
  productId: string,
  data: UpdateProductDto
): Promise<ActionResult> {
  return handleAdminAction(
    () =>
      http(`/products/${productId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    ["/admin/products"]
  );
}

export async function deleteProductAction(
  productId: string
): Promise<ActionResult> {
  return handleAdminAction(
    () => http(`/products/${productId}`, { method: "DELETE" }),
    ["/admin/products"]
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
    return res;
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
  return handleAdminAction(
    () =>
      http(`/skus/${skuId}`, {
        method: "PATCH",
        body: isFormData ? data : JSON.stringify(data),
      }),
    ["/admin/skus"]
  );
}

export async function deleteSkuAction(skuId: string): Promise<ActionResult> {
  return handleAdminAction(
    () => http(`/skus/${skuId}`, { method: "DELETE" }),
    ["/admin/skus"]
  );
}

// ============= ORDERS =============
/**
 * Lấy danh sách đơn hàng cho admin.
 */
export async function getOrdersAction(page = 1, limit = 10, search?: string) {
  try {
    let url = `/orders?page=${page}&limit=${limit}`;
    if (search) {
      url += `&search=${encodeURIComponent(search)}`;
    }
    const res = await http<ApiResponse<Order[]>>(url);
    return res;
  } catch (error: unknown) {
    return { error: (error as Error).message };
  }
}

export async function updateOrderStatusAction(
  orderId: string,
  status: string
): Promise<ActionResult> {
  return handleAdminAction(
    () =>
      http(`/orders/${orderId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
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
export async function getCouponsAction() {
  try {
    const res = await http<ApiResponse<Coupon[]>>("/coupons");
    return { data: res.data };
  } catch (error: unknown) {
    return { error: (error as Error).message };
  }
}

export async function createCouponAction(
  data: CreateCouponDto
): Promise<ActionResult> {
  return handleAdminAction(
    () => http("/coupons", { method: "POST", body: JSON.stringify(data) }),
    ["/admin/coupons"]
  );
}

export async function updateCouponAction(
  couponId: string,
  data: UpdateCouponDto
): Promise<ActionResult> {
  return handleAdminAction(
    () =>
      http(`/coupons/${couponId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    ["/admin/coupons"]
  );
}

export async function deleteCouponAction(
  couponId: string
): Promise<ActionResult> {
  return handleAdminAction(
    () => http(`/coupons/${couponId}`, { method: "DELETE" }),
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
export async function getReviewsAction(page = 1, limit = 10, search?: string) {
  try {
    let url = `/reviews?page=${page}&limit=${limit}`;
    if (search) {
      url += `&search=${encodeURIComponent(search)}`;
    }
    const response = await http<ApiResponse<Review[]>>(url);
    return response;
  } catch (error: unknown) {
    console.error("getReviewsAction error:", error);
    return { error: (error as Error).message };
  }
}

export async function updateReviewAction(
  reviewId: string,
  data: { comment?: string; rating?: number; isPublished?: boolean }
): Promise<ActionResult> {
  return handleAdminAction(
    () =>
      http(`/reviews/${reviewId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    ["/admin/reviews"]
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
  search?: string
) {
  try {
    let url = `/audit?page=${page}&limit=${limit}`;
    if (search) {
      url += `&search=${encodeURIComponent(search)}`;
    }
    const response = await http<ApiResponse<unknown[]>>(url);
    return response;
  } catch (error: unknown) {
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
  return handleAdminAction(
    () =>
      http(`/products/${productId}/translations`, {
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
