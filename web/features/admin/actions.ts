/**
 * =====================================================================
 * ADMIN SERVER ACTIONS ENTRY POINT
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. MỤC ĐÍCH:
 * - File này đóng vai trò là "Central Export Point" cho tất cả Server Actions của Admin.
 * - Giúp các Client Components chỉ cần import từ `@/features/admin/actions`
 *   thay vì phải nhớ đường dẫn chi tiết tới từng file domain.
 *
 * 2. CẤU TRÚC:
 * - Chúng ta chia nhỏ actions theo domain (product, order, user...) để dễ quản lý (Separation of Concerns).
 * - Nhưng ở đây ta gom lại (re-export) để dễ sử dụng (Developer Experience). *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Đóng vai trò quan trọng trong kiến trúc hệ thống, hỗ trợ các chức năng nghiệp vụ cụ thể.

 * =====================================================================
 */
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
