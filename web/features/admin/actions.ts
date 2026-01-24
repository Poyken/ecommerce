
// "use server";

/**
 * =====================================================================
 * ADMIN SERVER ACTIONS - Entry Point
 * =====================================================================
 * This file re-exports all admin actions from domain-specific modules.
 * =====================================================================
 */

export * from "./domain-actions/role-actions";
export * from "./domain-actions/user-actions";
export * from "./domain-actions/review-actions";
export * from "./domain-actions/metadata-actions";
export * from "./domain-actions/product-actions";
export * from "./domain-actions/tenant-actions";
export * from "./domain-actions/analytics-actions";
export * from "./domain-actions/order-actions";
export * from "./domain-actions/security-actions";
export * from "./domain-actions/notification-actions";
export * from "./domain-actions/page-actions";
export * from "./domain-actions/return-actions";
