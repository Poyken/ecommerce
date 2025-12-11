"use server";

import { http } from "@/lib/http";
import { revalidatePath } from "next/cache";

// ============= USERS =============
export async function getUsersAction(page = 1, limit = 10, search?: string) {
  try {
    let url = `/users?page=${page}&limit=${limit}`;
    if (search) {
      url += `&search=${encodeURIComponent(search)}`;
    }
    const response = await http<any>(url);

    console.log("\n=== getUsersAction DEBUG ===");
    console.log("Toàn bộ phản hồi:", JSON.stringify(response, null, 2));
    console.log("Kiểu dữ liệu response.data:", typeof response.data);
    console.log("response.data là Mảng:", Array.isArray(response.data));
    console.log("response.meta:", response.meta);
    console.log("Các khóa của response:", Object.keys(response));
    console.log("===========================\n");

    return response;
  } catch (error: any) {
    console.error("getUsersAction error:", error);
    return { error: error.message };
  }
}

export async function createUserAction(data: {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
}) {
  try {
    await http("/users", {
      method: "POST",
      body: JSON.stringify(data),
    });
    revalidatePath("/admin/users");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function updateUserAction(userId: string, data: any) {
  try {
    await http(`/users/${userId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
    revalidatePath("/admin/users");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function deleteUserAction(userId: string) {
  try {
    await http(`/users/${userId}`, { method: "DELETE" });
    revalidatePath("/admin/users");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function assignRolesAction(userId: string, roleIds: string[]) {
  try {
    await http(`/users/${userId}/roles`, {
      method: "POST",
      body: JSON.stringify({ roles: roleIds }),
    });
    revalidatePath("/admin/users");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

// ============= ROLES =============
export async function getRolesAction(page = 1, limit = 100, search?: string) {
  try {
    let url = `/roles?page=${page}&limit=${limit}`;
    if (search) {
      url += `&search=${encodeURIComponent(search)}`;
    }
    const res = await http<{ data: any[] }>(url);
    return { data: res.data };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function createRoleAction(name: string) {
  try {
    await http("/roles", {
      method: "POST",
      body: JSON.stringify({ name }),
    });
    revalidatePath("/admin/roles");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function updateRoleAction(roleId: string, name: string) {
  try {
    await http(`/roles/${roleId}`, {
      method: "PATCH",
      body: JSON.stringify({ name }),
    });
    revalidatePath("/admin/roles");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function deleteRoleAction(roleId: string) {
  try {
    await http(`/roles/${roleId}`, { method: "DELETE" });
    revalidatePath("/admin/roles");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function assignPermissionsAction(
  roleId: string,
  permissionIds: string[]
) {
  try {
    await http(`/roles/${roleId}/permissions`, {
      method: "POST",
      body: JSON.stringify({ permissions: permissionIds }),
    });
    revalidatePath("/admin/roles");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

// ============= PERMISSIONS =============
export async function getPermissionsAction() {
  try {
    const res = await http<{ data: any[] }>("/roles/permissions");
    return { data: res.data };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function createPermissionAction(name: string) {
  try {
    await http("/roles/permissions", {
      method: "POST",
      body: JSON.stringify({ name }),
    });
    revalidatePath("/admin/permissions");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function updatePermissionAction(
  permissionId: string,
  name: string
) {
  try {
    await http(`/roles/permissions/${permissionId}`, {
      method: "PATCH",
      body: JSON.stringify({ name }),
    });
    revalidatePath("/admin/permissions");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function deletePermissionAction(permissionId: string) {
  try {
    await http(`/roles/permissions/${permissionId}`, { method: "DELETE" });
    revalidatePath("/admin/permissions");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

// ============= BRANDS =============
export async function getBrandsAction(search?: string) {
  try {
    let url = `/brands`;
    if (search) {
      url += `?search=${encodeURIComponent(search)}`;
    }
    const res = await http<{ data: any[] }>(url);
    return { data: res.data };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function createBrandAction(name: string) {
  try {
    await http("/brands", {
      method: "POST",
      body: JSON.stringify({ name }),
    });
    revalidatePath("/admin/brands");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function updateBrandAction(brandId: string, name: string) {
  try {
    await http(`/brands/${brandId}`, {
      method: "PATCH",
      body: JSON.stringify({ name }),
    });
    revalidatePath("/admin/brands");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function deleteBrandAction(brandId: string) {
  try {
    await http(`/brands/${brandId}`, { method: "DELETE" });
    revalidatePath("/admin/brands");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

// ============= CATEGORIES =============
export async function getCategoriesAction(search?: string) {
  try {
    let url = `/categories`;
    if (search) {
      url += `?search=${encodeURIComponent(search)}`;
    }
    const res = await http<{ data: any[] }>(url);
    return { data: res.data };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function createCategoryAction(name: string, slug: string) {
  try {
    await http("/categories", {
      method: "POST",
      body: JSON.stringify({ name, slug }),
    });
    revalidatePath("/admin/categories");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function updateCategoryAction(
  categoryId: string,
  name: string,
  slug: string
) {
  try {
    await http(`/categories/${categoryId}`, {
      method: "PATCH",
      body: JSON.stringify({ name, slug }),
    });
    revalidatePath("/admin/categories");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function deleteCategoryAction(categoryId: string) {
  try {
    await http(`/categories/${categoryId}`, { method: "DELETE" });
    revalidatePath("/admin/categories");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

// ============= PRODUCTS =============
export async function getProductsAction(page = 1, limit = 10, search?: string) {
  try {
    let url = `/products?page=${page}&limit=${limit}`;
    if (search) {
      url += `&search=${encodeURIComponent(search)}`;
    }
    const res = await http<any>(url);
    return res;
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function createProductAction(data: any) {
  try {
    await http("/products", {
      method: "POST",
      body: JSON.stringify(data),
    });
    revalidatePath("/admin/products");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function updateProductAction(productId: string, data: any) {
  try {
    await http(`/products/${productId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
    revalidatePath("/admin/products");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function deleteProductAction(productId: string) {
  try {
    await http(`/products/${productId}`, { method: "DELETE" });
    revalidatePath("/admin/products");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

// ============= SKUS =============
export async function getSkusAction(page = 1, limit = 10, status?: string) {
  try {
    let url = `/skus?page=${page}&limit=${limit}`;
    if (status) {
      url += `&status=${status}`;
    }
    const res = await http<any>(url);
    return res;
  } catch (error: any) {
    return { error: error.message };
  }
}

// createSkuAction removed as SKUs are auto-generated


export async function updateSkuAction(skuId: string, data: any) {
  try {
    await http(`/skus/${skuId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
    revalidatePath("/admin/skus");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function deleteSkuAction(skuId: string) {
  try {
    await http(`/skus/${skuId}`, { method: "DELETE" });
    revalidatePath("/admin/skus");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

// ============= ORDERS =============
export async function getOrdersAction(page = 1, limit = 10, search?: string) {
  try {
    let url = `/orders?page=${page}&limit=${limit}`;
    if (search) {
      url += `&search=${encodeURIComponent(search)}`;
    }
    const res = await http<any>(url);
    return res;
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function updateOrderStatusAction(orderId: string, status: string) {
  try {
    await http(`/orders/${orderId}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    revalidatePath("/admin/orders");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function getOrderDetailsAction(orderId: string) {
  try {
    const res = await http<{ data: any }>(`/orders/${orderId}`);
    return { data: res.data };
  } catch (error: any) {
    return { error: error.message };
  }
}

// ============= REVIEWS =============
export async function getReviewsAction(page = 1, limit = 10) {
  try {
    const url = `/reviews?page=${page}&limit=${limit}`;
    const res = await http<any>(url);
    return res;
  } catch (error: any) {
    return { error: error.message };
  }
}

export async function deleteReviewAction(reviewId: string) {
  try {
    await http(`/reviews/${reviewId}`, { method: "DELETE" });
    revalidatePath("/admin/reviews");
    return { success: true };
  } catch (error: any) {
    return { error: error.message };
  }
}
