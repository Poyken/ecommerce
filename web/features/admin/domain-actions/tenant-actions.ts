"use server";

import { http } from "@/lib/http";
import {
  ApiResponse,
  ActionResult,
  CreateTenantDto,
  UpdateTenantDto,
} from "@/types/dtos";
import { Subscription, Tenant } from "@/types/models";
import { revalidatePath } from "next/cache";
import { wrapServerAction } from "@/lib/server-action-wrapper";

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
    revalidatePath("/super-admin/tenants", "page");
    return res.data;
  }, "Failed to create tenant");
}

export async function updateTenantAction(
  id: string,
  data: UpdateTenantDto
): Promise<ActionResult<Tenant>> {
  return wrapServerAction(async () => {
    const res = await http<ApiResponse<Tenant>>(`/tenants/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
    revalidatePath("/super-admin/tenants", "page");
    return res.data;
  }, "Failed to update tenant");
}

export async function deleteTenantAction(
  id: string
): Promise<ActionResult<void>> {
  return wrapServerAction(async () => {
    await http(`/tenants/${id}`, { method: "DELETE" });
    revalidatePath("/super-admin/tenants", "page");
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
    revalidatePath("/super-admin/subscriptions", "page");
  }, "Failed to cancel subscription");
}
