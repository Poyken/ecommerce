/**
 * =====================================================================
 * ADMIN FEATURE TYPES - Type definitions cho Admin Dashboard
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * File này định nghĩa các types riêng cho Admin feature để:
 * 1. Type Safety: Tránh dùng `any` trong các domain actions
 * 2. Reusability: Dùng chung cho nhiều components/actions
 * 3. Documentation: Rõ ràng về data structure
 *
 * =====================================================================
 */

// =============================================================================
// 📊 PAGINATION & QUERY PARAMS
// =============================================================================

/**
 * Common pagination parameters for list queries.
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
}

/**
 * Query parameters for fetching users list.
 */
export interface UserQueryParams extends PaginationParams {
  role?: string;
  status?: "active" | "inactive";
  sortBy?: "createdAt" | "firstName" | "email";
  sortOrder?: "asc" | "desc";
}

/**
 * Query parameters for fetching tenants list.
 */
export interface TenantQueryParams extends PaginationParams {
  plan?: "BASIC" | "PRO" | "ENTERPRISE";
  status?: "active" | "suspended";
}

// =============================================================================
// 📦 IMPORT/EXPORT TYPES
// =============================================================================

/**
 * Response from file export actions (Excel, CSV, etc.)
 */
export interface FileExportResult {
  base64: string;
  filename: string;
}

/**
 * Preview result from import actions.
 */
export interface ImportPreviewResult {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  errors: ImportError[];
  preview: ImportPreviewRow[];
}

export interface ImportError {
  row: number;
  field: string;
  message: string;
}

export interface ImportPreviewRow {
  rowNumber: number;
  data: Record<string, unknown>;
  isValid: boolean;
  errors?: string[];
}

// =============================================================================
// 🏢 TENANT TYPES
// =============================================================================

/**
 * Data for creating/updating a tenant.
 */
export interface TenantInput {
  name: string;
  subdomain?: string;
  customDomain?: string;
  plan: "BASIC" | "PRO" | "ENTERPRISE";
  themeConfig?: Record<string, unknown>;
}

// =============================================================================
// 📋 PLAN TYPES (Super Admin)
// =============================================================================

/**
 * Data for creating/updating a subscription plan.
 */
export interface PlanInput {
  name: string;
  code: string;
  price: number;
  billingFrequency: "MONTHLY" | "YEARLY";
  features: string[];
  limits: PlanLimits;
  isActive?: boolean;
}

export interface PlanLimits {
  maxProducts?: number;
  maxOrders?: number;
  maxUsers?: number;
  maxStorage?: number; // in MB
}

// =============================================================================
// 📊 SUBSCRIPTION TYPES
// =============================================================================

/**
 * Query parameters for fetching subscriptions list.
 */
export interface SubscriptionQueryParams extends PaginationParams {
  tenantId?: string;
  plan?: "BASIC" | "PRO" | "ENTERPRISE";
  status?: "active" | "cancelled" | "expired";
}

/**
 * Data for updating a subscription.
 */
export interface SubscriptionUpdateInput {
  plan?: "BASIC" | "PRO" | "ENTERPRISE";
  billingFrequency?: "MONTHLY" | "YEARLY";
  isActive?: boolean;
  cancelAtPeriodEnd?: boolean;
}

// =============================================================================
// 📋 SUPER ADMIN PLAN TYPES
// =============================================================================

/**
 * Subscription plan definition.
 */
export interface Plan {
  id: string;
  name: string;
  code: string;
  price: number | string;
  billingFrequency: "MONTHLY" | "YEARLY";
  features: string[];
  limits?: PlanLimits;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
