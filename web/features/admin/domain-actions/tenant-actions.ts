
"use server";

import { ActionResult, CreateTenantDto, UpdateTenantDto } from "@/types/dtos";
import { Subscription, Tenant } from "@/types/models";
import { REVALIDATE, wrapServerAction } from "@/lib/safe-action";
import {
  SubscriptionQueryParams,
  SubscriptionUpdateInput,
} from "@/types/feature-types/admin.types";

import { adminTenantService } from "../services/admin-tenant.service";

/**
 * =====================================================================
 * TENANT & SUBSCRIPTION ACTIONS - Quản lý khách hàng doanh nghiệp
 * =====================================================================
 */

export async function getTenantsAction(): Promise<ActionResult<Tenant[]>> {
  return wrapServerAction(
    () => adminTenantService.getTenants(),
    "Failed to fetch tenants"
  );
}

export async function getTenantAction(
  id: string
): Promise<ActionResult<Tenant>> {
  return wrapServerAction(
    () => adminTenantService.getTenant(id),
    "Failed to fetch tenant"
  );
}

export async function createTenantAction(
  data: CreateTenantDto
): Promise<ActionResult<Tenant>> {
  return wrapServerAction(async () => {
    const res = await adminTenantService.createTenant(data);
    REVALIDATE.superAdmin.tenants();
    return res.data;
  }, "Failed to create tenant");
}

export async function updateTenantAction(
  id: string,
  data: UpdateTenantDto
): Promise<ActionResult<Tenant>> {
  return wrapServerAction(async () => {
    const res = await adminTenantService.updateTenant(id, data);
    REVALIDATE.superAdmin.tenants();
    return res.data;
  }, "Failed to update tenant");
}

export async function deleteTenantAction(
  id: string
): Promise<ActionResult<void>> {
  return wrapServerAction(async () => {
    await adminTenantService.deleteTenant(id);
    REVALIDATE.superAdmin.tenants();
  }, "Failed to delete tenant");
}

export async function getSubscriptionsAction(
  params: SubscriptionQueryParams = {}
): Promise<ActionResult<Subscription[]>> {
  return wrapServerAction(
    () => adminTenantService.getSubscriptions(params),
    "Failed to fetch subscriptions"
  );
}

export async function cancelSubscriptionAction(
  id: string
): Promise<ActionResult<void>> {
  return wrapServerAction(async () => {
    await adminTenantService.cancelSubscription(id);
    REVALIDATE.superAdmin.subscriptions();
  }, "Failed to cancel subscription");
}

export async function updateSubscriptionAction(
  id: string,
  data: SubscriptionUpdateInput
): Promise<ActionResult<Subscription>> {
  return wrapServerAction(async () => {
    const res = await adminTenantService.updateSubscription(id, data);
    REVALIDATE.superAdmin.subscriptions();
    return res.data;
  }, "Failed to update subscription");
}

export async function deleteSubscriptionAction(
  id: string
): Promise<ActionResult<void>> {
  return wrapServerAction(async () => {
    await adminTenantService.deleteSubscription(id);
    REVALIDATE.superAdmin.subscriptions();
  }, "Failed to delete subscription");
}
