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
 * - `REVALIDATE.superAdmin.tenants()`: Cache key riêng biệt cho khu vực SuperAdmin. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Multi-tenant SaaS Management: Cung cấp các công cụ cho SuperAdmin để quản trị toàn bộ các khách hàng doanh nghiệp (Tenant) thuê nền tảng, đảm bảo tính biệt lập về dữ liệu.
 * - Subscription Lifecycle: Quản lý vòng đời đăng ký dịch vụ (Subscription) của từng doanh nghiệp, bao gồm việc gia hạn, nâng cấp hoặc hủy gói dịch vụ linh hoạt.

 * =====================================================================
 */
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
