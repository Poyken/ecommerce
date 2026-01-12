/**
 * =====================================================================
 * TENANT ACTIONS - Quản lý Khách hàng Doanh nghiệp (SaaS)
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. CONTEXT:
 * - Hệ thống của chúng ta là Multi-tenant (SaaS).
 * - `Tenant` đại diện cho một khách hàng doanh nghiệp thuê platform.
 *
 * 2. SUPER ADMIN ONLY:
 * - Các actions này chỉ dành cho SuperAdmin. Tenant Admin bình thường không được gọi.
 * - `REVALIDATE.superAdmin.tenants()`: Cache key riêng biệt cho khu vực SuperAdmin.
 * =====================================================================
 */
"use server";

import { http } from "@/lib/http";
import {
  ApiResponse,
  ActionResult,
  CreateTenantDto,
  UpdateTenantDto,
} from "@/types/dtos";
import { Subscription, Tenant } from "@/types/models";
import { REVALIDATE, wrapServerAction } from "@/lib/safe-action";

/**
 * =====================================================================
 * TENANT & SUBSCRIPTION ACTIONS - Quản lý khách hàng doanh nghiệp
 * =====================================================================
 */

export async function getTenantsAction(): Promise<ActionResult<Tenant[]>> {
  return wrapServerAction(
    () => http<ApiResponse<Tenant[]>>("/tenants"),
    "Failed to fetch tenants"
  );
}

export async function getTenantAction(
  id: string
): Promise<ActionResult<Tenant>> {
  return wrapServerAction(
    () => http<ApiResponse<Tenant>>(`/tenants/${id}`),
    "Failed to fetch tenant"
  );
}

export async function createTenantAction(
  data: CreateTenantDto
): Promise<ActionResult<Tenant>> {
  return wrapServerAction(async () => {
    const res = await http<ApiResponse<Tenant>>("/tenants", {
      method: "POST",
      body: JSON.stringify(data),
    });
    REVALIDATE.superAdmin.tenants();
    return res.data;
  }, "Failed to create tenant");
}

export async function updateTenantAction(
  id: string,
  data: UpdateTenantDto
): Promise<ActionResult<Tenant>> {
  return wrapServerAction(async () => {
    const res = await http<ApiResponse<Tenant>>(`/tenants/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
    REVALIDATE.superAdmin.tenants();
    return res.data;
  }, "Failed to update tenant");
}

export async function deleteTenantAction(
  id: string
): Promise<ActionResult<void>> {
  return wrapServerAction(async () => {
    await http(`/tenants/${id}`, { method: "DELETE" });
    REVALIDATE.superAdmin.tenants();
  }, "Failed to delete tenant");
}

export async function getSubscriptionsAction(
  params: any = {}
): Promise<ActionResult<Subscription[]>> {
  return wrapServerAction(
    () => http<ApiResponse<Subscription[]>>("/subscriptions", { params }),
    "Failed to fetch subscriptions"
  );
}

export async function cancelSubscriptionAction(
  id: string
): Promise<ActionResult<void>> {
  return wrapServerAction(async () => {
    await http(`/subscriptions/${id}/cancel`, { method: "POST" });
    REVALIDATE.superAdmin.subscriptions();
  }, "Failed to cancel subscription");
}

export async function updateSubscriptionAction(
  id: string,
  data: any
): Promise<ActionResult<Subscription>> {
  return wrapServerAction(async () => {
    const res = await http<ApiResponse<Subscription>>(`/subscriptions/${id}`, {
      method: "POST",
      body: JSON.stringify(data),
    });
    REVALIDATE.superAdmin.subscriptions();
    return res.data;
  }, "Failed to update subscription");
}

export async function deleteSubscriptionAction(
  id: string
): Promise<ActionResult<void>> {
  return wrapServerAction(async () => {
    await http(`/subscriptions/${id}`, { method: "DELETE" });
    REVALIDATE.superAdmin.subscriptions();
  }, "Failed to delete subscription");
}
