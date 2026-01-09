"use server";

import { http } from "@/lib/http";
import {
  AnalyticsStats,
  ApiResponse,
  CreateBrandDto,
  CreateCategoryDto,
  CreateCouponDto,
  CreateProductDto,
  CreateTenantDto,
  CreateUserDto,
  SalesDataPoint,
  SecurityStats,
  TopProduct,
  UpdateBrandDto,
  UpdateCategoryDto,
  UpdateCouponDto,
  UpdateProductDto,
  UpdateSkuDto,
  UpdateTenantDto,
  UpdateUserDto,
} from "@/types/dtos";
import {
  AuditLog,
  Brand,
  Category,
  Coupon,
  Order,
  Permission,
  Product,
  ProductTranslation,
  Review,
  Role,
  Subscription,
  Sku,
  Tenant,
  User,
} from "@/types/models";
import { revalidatePath } from "next/cache";

// ==================== PERMISSIONS ====================

export async function createPermissionAction(name: string) {
  try {
    const res = await http<ApiResponse<Permission>>("/permissions", {
      method: "POST",
      body: JSON.stringify({ name }),
    });

    revalidatePath("/admin/permissions");
    return { success: true, data: res.data };
  } catch (error: unknown) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create permission",
    };
  }
}

export async function updatePermissionAction(id: string, name: string) {
  try {
    const res = await http<ApiResponse<Permission>>(`/permissions/${id}`, {
      method: "PUT",
      body: JSON.stringify({ name }),
    });

    revalidatePath("/admin/permissions");
    return { success: true, data: res.data };
  } catch (error: unknown) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update permission",
    };
  }
}

export async function deletePermissionAction(id: string) {
  try {
    await http<ApiResponse<void>>(`/permissions/${id}`, {
      method: "DELETE",
    });

    revalidatePath("/admin/permissions");
    return { success: true };
  } catch (error: unknown) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to delete permission",
    };
  }
}

export async function getPermissionsAction() {
  try {
    const res = await http<ApiResponse<Permission[]>>("/permissions");
    return { success: true, data: res.data };
  } catch (error: unknown) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch permissions",
    };
  }
}

export async function assignPermissionsAction(
  roleId: string,
  permissionIds: string[]
) {
  try {
    await http<ApiResponse<void>>(`/roles/${roleId}/permissions`, {
      method: "POST",
      body: JSON.stringify({ permissionIds }),
    });
    revalidatePath("/admin/roles");
    return { success: true };
  } catch (error: unknown) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to assign permissions",
    };
  }
}

// ==================== ROLES ====================

export async function getRolesAction() {
  try {
    const res = await http<ApiResponse<Role[]>>("/roles");
    return { success: true, data: res.data };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch roles",
    };
  }
}

export async function createRoleAction(data: {
  name: string;
  permissions?: string[];
}) {
  try {
    const res = await http<ApiResponse<Role>>("/roles", {
      method: "POST",
      body: JSON.stringify(data),
    });
    revalidatePath("/admin/roles");
    return { success: true, data: res.data };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create role",
    };
  }
}

export async function updateRoleAction(
  id: string,
  data: { name: string; permissions?: string[] }
) {
  try {
    const res = await http<ApiResponse<Role>>(`/roles/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
    revalidatePath("/admin/roles");
    return { success: true, data: res.data };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update role",
    };
  }
}

export async function deleteRoleAction(id: string) {
  try {
    await http<ApiResponse<void>>(`/roles/${id}`, {
      method: "DELETE",
    });
    revalidatePath("/admin/roles");
    return { success: true };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete role",
    };
  }
}

// ==================== USERS & ROLES ASSIGNMENT ====================

export async function getUsersAction(params?: any) {
  try {
    const query = new URLSearchParams(params).toString();
    const res = await http<ApiResponse<User[]>>(`/users?${query}`);
    return { success: true, data: res.data, meta: res.meta };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch users",
    };
  }
}

export async function assignRolesAction(userId: string, roleIds: string[]) {
  try {
    await http<ApiResponse<void>>(`/users/${userId}/roles`, {
      method: "POST",
      body: JSON.stringify({ roleIds }),
    });
    revalidatePath("/admin/users");
    return { success: true };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to assign roles",
    };
  }
}

export async function createUserAction(data: CreateUserDto) {
  try {
    const res = await http<ApiResponse<User>>("/users", {
      method: "POST",
      body: JSON.stringify(data),
    });
    revalidatePath("/admin/users");
    return { success: true, data: res.data };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create user",
    };
  }
}

export async function updateUserAction(id: string, data: UpdateUserDto) {
  try {
    const res = await http<ApiResponse<User>>(`/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
    revalidatePath("/admin/users");
    return { success: true, data: res.data };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update user",
    };
  }
}

export async function deleteUserAction(id: string) {
  try {
    await http<ApiResponse<void>>(`/users/${id}`, {
      method: "DELETE",
    });
    revalidatePath("/admin/users");
    return { success: true };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete user",
    };
  }
}

// ==================== REVIEWS ====================

export async function getReviewsAction(params?: any) {
  try {
    const query = new URLSearchParams(params).toString();
    const res = await http<ApiResponse<Review[]>>(`/reviews?${query}`);
    return { success: true, data: res.data, meta: res.meta };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch reviews",
    };
  }
}

export async function deleteReviewAction(id: string) {
  try {
    await http<ApiResponse<void>>(`/reviews/${id}`, {
      method: "DELETE",
    });
    revalidatePath("/admin/reviews");
    return { success: true };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete review",
    };
  }
}

export async function replyToReviewAction(id: string, reply: string) {
  try {
    const res = await http<ApiResponse<Review>>(`/reviews/${id}/reply`, {
      method: "POST",
      body: JSON.stringify({ reply }),
    });
    revalidatePath("/admin/reviews");
    return { success: true, data: res.data };
  } catch (error: unknown) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to reply to review",
    };
  }
}

export async function toggleReviewStatusAction(id: string) {
  try {
    const res = await http<ApiResponse<Review>>(
      `/reviews/${id}/toggle-status`,
      {
        method: "PATCH",
      }
    );
    revalidatePath("/admin/reviews");
    return { success: true, data: res.data };
  } catch (error: unknown) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to toggle review status",
    };
  }
}

export async function analyzeReviewSentimentAction(id: string) {
  try {
    const res = await http<ApiResponse<any>>(
      `/reviews/${id}/analyze-sentiment`,
      {
        method: "POST",
      }
    );
    revalidatePath("/admin/reviews");
    return { success: true, data: res.data };
  } catch (error: unknown) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to analyze sentiment",
    };
  }
}

// ==================== BRANDS ====================

export async function getBrandsAction(
  page?: number,
  limit?: number,
  search?: string
) {
  try {
    const params = new URLSearchParams();
    if (page) params.append("page", page.toString());
    if (limit) params.append("limit", limit.toString());
    if (search) params.append("search", search);

    const res = await http<ApiResponse<Brand[]>>(
      `/brands?${params.toString()}`
    );
    return { success: true, data: res.data, meta: res.meta };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch brands",
    };
  }
}

export async function createBrandAction(data: CreateBrandDto) {
  try {
    const res = await http<ApiResponse<Brand>>("/brands", {
      method: "POST",
      body: JSON.stringify(data),
    });
    revalidatePath("/admin/brands");
    return { success: true, data: res.data };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create brand",
    };
  }
}

export async function updateBrandAction(id: string, data: UpdateBrandDto) {
  try {
    const res = await http<ApiResponse<Brand>>(`/brands/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
    revalidatePath("/admin/brands");
    return { success: true, data: res.data };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update brand",
    };
  }
}

export async function deleteBrandAction(id: string) {
  try {
    await http<ApiResponse<void>>(`/brands/${id}`, {
      method: "DELETE",
    });
    revalidatePath("/admin/brands");
    return { success: true };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete brand",
    };
  }
}

// ==================== CATEGORIES ====================

export async function getCategoriesAction(
  page?: number,
  limit?: number,
  search?: string
) {
  try {
    const params = new URLSearchParams();
    if (page) params.append("page", page.toString());
    if (limit) params.append("limit", limit.toString());
    if (search) params.append("search", search);

    const res = await http<ApiResponse<Category[]>>(
      `/categories?${params.toString()}`
    );
    return { success: true, data: res.data, meta: res.meta };
  } catch (error: unknown) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch categories",
    };
  }
}

export async function createCategoryAction(data: CreateCategoryDto) {
  try {
    const res = await http<ApiResponse<Category>>("/categories", {
      method: "POST",
      body: JSON.stringify(data),
    });
    revalidatePath("/admin/categories");
    return { success: true, data: res.data };
  } catch (error: unknown) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create category",
    };
  }
}

export async function updateCategoryAction(
  id: string,
  data: UpdateCategoryDto
) {
  try {
    const res = await http<ApiResponse<Category>>(`/categories/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
    revalidatePath("/admin/categories");
    return { success: true, data: res.data };
  } catch (error: unknown) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update category",
    };
  }
}

export async function deleteCategoryAction(id: string) {
  try {
    await http<ApiResponse<void>>(`/categories/${id}`, {
      method: "DELETE",
    });
    revalidatePath("/admin/categories");
    return { success: true };
  } catch (error: unknown) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to delete category",
    };
  }
}

// ==================== COUPONS ====================

export async function getCouponsAction(
  page?: number,
  limit?: number,
  search?: string
) {
  try {
    const params = new URLSearchParams();
    if (page) params.append("page", page.toString());
    if (limit) params.append("limit", limit.toString());
    if (search) params.append("search", search);

    const res = await http<ApiResponse<Coupon[]>>(
      `/coupons?${params.toString()}`
    );
    return { success: true, data: res.data, meta: res.meta };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch coupons",
    };
  }
}

export async function createCouponAction(data: CreateCouponDto) {
  try {
    const res = await http<ApiResponse<Coupon>>("/coupons", {
      method: "POST",
      body: JSON.stringify(data),
    });
    revalidatePath("/admin/coupons");
    return { success: true, data: res.data };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create coupon",
    };
  }
}

export async function updateCouponAction(id: string, data: UpdateCouponDto) {
  try {
    const res = await http<ApiResponse<Coupon>>(`/coupons/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
    revalidatePath("/admin/coupons");
    return { success: true, data: res.data };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update coupon",
    };
  }
}

export async function deleteCouponAction(id: string) {
  try {
    await http<ApiResponse<void>>(`/coupons/${id}`, {
      method: "DELETE",
    });
    revalidatePath("/admin/coupons");
    return { success: true };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete coupon",
    };
  }
}

// ==================== PAGES ====================

export async function getPagesAction(params?: any) {
  try {
    const query = new URLSearchParams(params).toString();
    const res = await http<ApiResponse<any[]>>(`/pages?${query}`);
    return { success: true, data: res.data };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch pages",
    };
  }
}

export async function getPageByIdAction(id: string) {
  try {
    const res = await http<ApiResponse<any>>(`/pages/${id}`);
    return { success: true, data: res.data };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch page",
    };
  }
}

export async function createPageAction(data: any) {
  try {
    const res = await http<ApiResponse<any>>("/pages", {
      method: "POST",
      body: JSON.stringify(data),
    });
    revalidatePath("/admin/pages");
    return { success: true, data: res.data };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create page",
    };
  }
}

export async function updatePageAction(id: string, data: any) {
  try {
    const res = await http<ApiResponse<any>>(`/pages/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
    revalidatePath("/admin/pages");
    return { success: true, data: res.data };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update page",
    };
  }
}

export async function deletePageAction(id: string) {
  try {
    await http<ApiResponse<void>>(`/pages/${id}`, {
      method: "DELETE",
    });
    revalidatePath("/admin/pages");
    return { success: true };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete page",
    };
  }
}

// ==================== PRODUCTS ====================

export async function getProductsAction(params?: any) {
  try {
    const query = new URLSearchParams(params).toString();
    const res = await http<ApiResponse<Product[]>>(`/products?${query}`);
    return { success: true, data: res.data, meta: res.meta };
  } catch (error: unknown) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch products",
    };
  }
}

export async function createProductAction(data: CreateProductDto) {
  try {
    const res = await http<ApiResponse<Product>>("/products", {
      method: "POST",
      body: JSON.stringify(data),
    });
    revalidatePath("/admin/products");
    return { success: true, data: res.data };
  } catch (error: unknown) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create product",
    };
  }
}

export async function updateProductAction(id: string, data: UpdateProductDto) {
  try {
    const res = await http<ApiResponse<Product>>(`/products/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
    revalidatePath("/admin/products");
    return { success: true, data: res.data };
  } catch (error: unknown) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update product",
    };
  }
}

export async function deleteProductAction(id: string) {
  try {
    await http<ApiResponse<void>>(`/products/${id}`, {
      method: "DELETE",
    });
    revalidatePath("/admin/products");
    return { success: true };
  } catch (error: unknown) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to delete product",
    };
  }
}

export async function generateProductContentAction(data: { name: string }) {
  try {
    const res = await http<ApiResponse<any>>("/products/generate-content", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return { success: true, data: res.data };
  } catch (error: unknown) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to generate content",
    };
  }
}

export async function getSkusAction(
  page: number = 1,
  limit: number = 10,
  status?: string,
  search?: string,
  stockLimit?: number
) {
  try {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    if (status) params.append("status", status);
    if (search) params.append("search", search);
    if (stockLimit) params.append("stockLimit", stockLimit.toString());

    const res = await http<ApiResponse<Sku[]>>(`/skus?${params.toString()}`);
    return { success: true, data: res.data, meta: res.meta };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch SKUs",
    };
  }
}

export async function updateSkuAction(id: string, data: UpdateSkuDto) {
  try {
    const res = await http<ApiResponse<any>>(`/skus/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
    revalidatePath("/admin/products");
    return { success: true, data: res.data };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update stock",
    };
  }
}

// ==================== TENANTS ====================

export async function getTenantsAction() {
  try {
    const res = await http<ApiResponse<Tenant[]>>("/tenants");
    return { success: true, data: res.data };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch tenants",
    };
  }
}

export async function getTenantAction(id: string) {
  try {
    const res = await http<ApiResponse<Tenant>>(`/tenants/${id}`);
    return { success: true, data: res.data };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch tenant",
    };
  }
}

export async function createTenantAction(data: CreateTenantDto) {
  try {
    const res = await http<ApiResponse<Tenant>>("/tenants", {
      method: "POST",
      body: JSON.stringify(data),
    });
    revalidatePath("/super-admin/tenants");
    return { success: true, data: res.data };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create tenant",
    };
  }
}

export async function updateTenantAction(id: string, data: UpdateTenantDto) {
  try {
    const res = await http<ApiResponse<Tenant>>(`/tenants/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
    revalidatePath("/super-admin/tenants");
    return { success: true, data: res.data };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update tenant",
    };
  }
}

export async function deleteTenantAction(id: string) {
  try {
    await http<ApiResponse<void>>(`/tenants/${id}`, {
      method: "DELETE",
    });
    revalidatePath("/super-admin/tenants");
    return { success: true };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete tenant",
    };
  }
}

// ==================== SUBSCRIPTIONS ====================

export async function getSubscriptionsAction() {
  try {
    const res = await http<ApiResponse<Subscription[]>>("/subscriptions");
    return { success: true, data: res.data };
  } catch (error: unknown) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch subscriptions",
    };
  }
}

export async function cancelSubscriptionAction(id: string) {
  try {
    await http<ApiResponse<void>>(`/subscriptions/${id}/cancel`, {
      method: "POST",
    });
    revalidatePath("/super-admin/subscriptions");
    return { success: true };
  } catch (error: unknown) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to cancel subscription",
    };
  }
}

// ==================== DASHBOARD & ANALYTICS ====================

export async function getAnalyticsStatsAction() {
  try {
    const res = await http<ApiResponse<AnalyticsStats>>("/analytics/stats");
    return { success: true, data: res.data };
  } catch (error: unknown) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch analytics stats",
    };
  }
}

export async function getSalesDataAction(range: string) {
  try {
    const res = await http<ApiResponse<SalesDataPoint[]>>(
      `/analytics/sales?range=${range}`
    );
    return { success: true, data: res.data };
  } catch (error: unknown) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch sales data",
    };
  }
}

export async function getTopProductsAction() {
  try {
    const res = await http<ApiResponse<TopProduct[]>>(
      "/analytics/top-products"
    );
    return { success: true, data: res.data };
  } catch (error: unknown) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch top products",
    };
  }
}

export async function getBlogStatsAction() {
  try {
    const res = await http<ApiResponse<any>>("/blog/stats"); // Adjust return type if needed
    return { success: true, data: res.data };
  } catch (error: unknown) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch blog stats",
    };
  }
}

// ==================== ORDERS ====================

export async function getOrdersAction(params?: any) {
  try {
    const query = new URLSearchParams(params).toString();
    const res = await http<ApiResponse<Order[]>>(`/orders?${query}`);
    return { success: true, data: res.data, meta: res.meta };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch orders",
    };
  }
}

export async function getOrderDetailsAction(id: string) {
  try {
    const res = await http<ApiResponse<Order>>(`/orders/${id}`);
    return { success: true, data: res.data };
  } catch (error: unknown) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch order details",
    };
  }
}

export async function updateOrderStatusAction(id: string, status: string) {
  try {
    const res = await http<ApiResponse<Order>>(`/orders/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    revalidatePath("/admin/orders");
    return { success: true, data: res.data };
  } catch (error: unknown) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to update order status",
    };
  }
}

// ==================== SECURITY ====================

export async function getSecurityStatsAction() {
  try {
    const res = await http<ApiResponse<SecurityStats>>("/security/stats");
    return { success: true, data: res.data };
  } catch (error: unknown) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch security stats",
    };
  }
}

export async function getLockdownStatusAction() {
  try {
    const res = await http<ApiResponse<{ isLockdown: boolean }>>(
      "/security/lockdown"
    );
    return { success: true, data: res.data };
  } catch (error: unknown) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch lockdown status",
    };
  }
}

export async function toggleLockdownAction(enabled: boolean) {
  try {
    const res = await http<ApiResponse<any>>("/security/lockdown", {
      method: "POST",
      body: JSON.stringify({ enabled }),
    });
    revalidatePath("/super-admin/security");
    revalidatePath("/");
    return { success: true, data: res.data };
  } catch (error: unknown) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to toggle lockdown",
    };
  }
}

export async function getSuperAdminWhitelistAction() {
  try {
    const res = await http<ApiResponse<string[]>>("/security/whitelist");
    return { success: true, data: res.data };
  } catch (error: unknown) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch whitelist",
    };
  }
}

export async function updateSuperAdminWhitelistAction(ips: string[]) {
  try {
    // eslint-disable-next-line
    const res = await http<ApiResponse<any>>("/security/whitelist", {
      method: "PUT",
      body: JSON.stringify({ ips }),
    });
    revalidatePath("/super-admin/security");
    return { success: true };
  } catch (error: unknown) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update whitelist",
    };
  }
}

export async function getMyIpAction() {
  try {
    const res = await http<ApiResponse<{ ip: string }>>("/security/my-ip");
    return { success: true, data: res.data };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch IP",
    };
  }
}

export async function getAuditLogsAction(params?: any) {
  try {
    const query = new URLSearchParams(params).toString();
    const res = await http<ApiResponse<AuditLog[]>>(`/audit-logs?${query}`);
    return { success: true, data: res.data, meta: res.meta };
  } catch (error: unknown) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch audit logs",
    };
  }
}

// ==================== TRANSLATIONS ====================

export async function getProductTranslationsAction(productId: string) {
  try {
    const res = await http<ApiResponse<ProductTranslation[]>>(
      `/products/${productId}/translations`
    );
    return { success: true, data: res.data };
  } catch (error: unknown) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch translations",
    };
  }
}

export async function updateProductTranslationAction(id: string, data: any) {
  try {
    const res = await http<ApiResponse<ProductTranslation>>(
      `/product-translations/${id}`,
      {
        method: "PUT",
        body: JSON.stringify(data),
      }
    );
    revalidatePath("/admin/products");
    return { success: true, data: res.data };
  } catch (error: unknown) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to update translation",
    };
  }
}

export async function translateTextAction(text: string, targetLang: string) {
  try {
    const res = await http<ApiResponse<{ translatedText: string }>>(
      "/ai/translate",
      {
        method: "POST",
        body: JSON.stringify({ text, targetLang }),
      }
    );
    return { success: true, data: res.data };
  } catch (error: unknown) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to translate text",
    };
  }
}

// ==================== NOTIFICATIONS ====================

export async function broadcastNotificationAction(data: any) {
  try {
    await http<ApiResponse<void>>("/notifications/broadcast", {
      method: "POST",
      body: JSON.stringify(data),
    });
    return { success: true };
  } catch (error: unknown) {
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to broadcast notification",
    };
  }
}

export async function sendNotificationToUserAction(userId: string, data: any) {
  try {
    await http<ApiResponse<void>>(`/notifications/user/${userId}`, {
      method: "POST",
      body: JSON.stringify(data),
    });
    return { success: true };
  } catch (error: unknown) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to send notification",
    };
  }
}
