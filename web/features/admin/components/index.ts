/**
 * =====================================================================
 * ADMIN COMPONENTS INDEX - Thư viện Components Admin
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. TỔ CHỨC FILE:
 * - Các components được chia theo Domain (Products, Users, Orders...) hoặc Loại (Dialogs, UI Charts...).
 *
 * 2. DIALOG PATTERN:
 * - Hầu hết các tính năng Create/Edit đều dùng Dialog (Modal).
 * - VD: `CreateProductDialog`, `EditUserDialog`.
 * - Lợi ích: User không bị chuyển trang, giữ context hiện tại, UX tốt hơn.
 *
 * 3. EXPORT STRATEGY:
 * - Re-export tất cả tại đây giúp việc import ở các page clean hơn rất nhiều.
 * =====================================================================
 */
/**
 * =====================================================================
 * ADMIN COMPONENTS INDEX
 * =====================================================================
 */

// Core
export * from "./core/feature-flag-initializer";
export * from "./core/page-builder-client";
export * from "./core/pages-list-client";
export * from "./core/tenant-dialog";

// Content
export * from "./content/add-block-dialog";
export * from "./content/create-page-dialog";

// Coupons
export * from "./coupons/create-coupon-dialog";
export * from "./coupons/edit-coupon-dialog";

// Taxonomy (Brands & Categories)
export * from "./taxonomy/create-brand-dialog";
export * from "./taxonomy/create-category-dialog";
export * from "./taxonomy/edit-brand-dialog";
export * from "./taxonomy/edit-category-dialog";

// Products
export * from "./products/create-product-dialog";
export * from "./products/edit-product-dialog";
export * from "./products/edit-sku-dialog";
export * from "./products/magic-write-button";
export * from "./products/product-translation-dialog";

// Users
export * from "./users/add-address-dialog";
export * from "./users/assign-permissions-dialog";
export * from "./users/assign-roles-dialog";
export * from "./users/create-user-dialog";
export * from "./users/edit-user-dialog";

// Orders
export * from "./orders/order-details-dialog";
export * from "./orders/update-order-status-dialog";

// Shared
export * from "./shared/delete-confirm-dialog";

// Roles & Permissions
export * from "./roles/create-permission-dialog";
export * from "./roles/create-role-dialog";
export * from "./roles/edit-permission-dialog";
export * from "./roles/edit-role-dialog";

// Navigation
export * from "./navigation/admin-header";
export * from "./navigation/admin-notification-bell";
export * from "./navigation/admin-notification-item";
export * from "./navigation/admin-sidebar";
export * from "./navigation/notification-center";

// UI
export * from "./ui/admin-alerts";
export * from "./ui/admin-charts";
export * from "./ui/admin-page-components";
export * from "./ui/admin-search-input";
export * from "./ui/admin-stats";
export * from "./ui/block-style-controls";
export * from "./ui/lazy-admin-charts";
export * from "./ui/media-gallery";
export * from "./ui/seo-settings";

// Widgets
export * from "./widgets/quick-actions";
export * from "./widgets/recent-chats-widget";
export * from "./widgets/storefront-pulse";

// Other
export * from "./page-settings-sheet";
