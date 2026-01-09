"use server";

/**
 * =====================================================================
 * ADMIN SERVER ACTIONS - Entry Point
 * =====================================================================
 * This file re-exports all admin actions from domain-specific modules.
 * Each action is wrapped as an async function to satisfy "use server" requirements.
 * =====================================================================
 */

// Re-export from role-actions
import {
  createPermissionAction as _createPermissionAction,
  updatePermissionAction as _updatePermissionAction,
  deletePermissionAction as _deletePermissionAction,
  getPermissionsAction as _getPermissionsAction,
  assignPermissionsAction as _assignPermissionsAction,
  getRolesAction as _getRolesAction,
  createRoleAction as _createRoleAction,
  updateRoleAction as _updateRoleAction,
  deleteRoleAction as _deleteRoleAction,
} from "./domain-actions/role-actions";

// Re-export from user-actions
import {
  getUsersAction as _getUsersAction,
  createUserAction as _createUserAction,
  updateUserAction as _updateUserAction,
  deleteUserAction as _deleteUserAction,
  assignRolesAction as _assignRolesAction,
} from "./domain-actions/user-actions";

// Re-export from review-actions
import {
  getReviewsAction as _getReviewsAction,
  deleteReviewAction as _deleteReviewAction,
  replyToReviewAction as _replyToReviewAction,
  updateReviewStatusAction as _updateReviewStatusAction,
  analyzeReviewSentimentAction as _analyzeReviewSentimentAction,
} from "./domain-actions/review-actions";

// Re-export from metadata-actions
import {
  getBrandsAction as _getBrandsAction,
  createBrandAction as _createBrandAction,
  updateBrandAction as _updateBrandAction,
  deleteBrandAction as _deleteBrandAction,
  getCategoriesAction as _getCategoriesAction,
  createCategoryAction as _createCategoryAction,
  updateCategoryAction as _updateCategoryAction,
  deleteCategoryAction as _deleteCategoryAction,
  getCouponsAction as _getCouponsAction,
  createCouponAction as _createCouponAction,
  updateCouponAction as _updateCouponAction,
  deleteCouponAction as _deleteCouponAction,
} from "./domain-actions/metadata-actions";

// Re-export from product-actions
import {
  getProductsAction as _getProductsAction,
  createProductAction as _createProductAction,
  updateProductAction as _updateProductAction,
  deleteProductAction as _deleteProductAction,
  getSkusAction as _getSkusAction,
  updateSkuAction as _updateSkuAction,
  getProductTranslationsAction as _getProductTranslationsAction,
  updateProductTranslationAction as _updateProductTranslationAction,
  generateProductContentAction as _generateProductContentAction,
  translateTextAction as _translateTextAction,
} from "./domain-actions/product-actions";

// Re-export from tenant-actions
import {
  getTenantsAction as _getTenantsAction,
  getTenantAction as _getTenantAction,
  createTenantAction as _createTenantAction,
  updateTenantAction as _updateTenantAction,
  deleteTenantAction as _deleteTenantAction,
  getSubscriptionsAction as _getSubscriptionsAction,
  cancelSubscriptionAction as _cancelSubscriptionAction,
} from "./domain-actions/tenant-actions";

// Re-export from analytics-actions
import {
  getAnalyticsStatsAction as _getAnalyticsStatsAction,
  getSalesDataAction as _getSalesDataAction,
  getTopProductsAction as _getTopProductsAction,
  getBlogStatsAction as _getBlogStatsAction,
} from "./domain-actions/analytics-actions";

// Re-export from order-actions
import {
  getOrdersAction as _getOrdersAction,
  getOrderDetailsAction as _getOrderDetailsAction,
  updateOrderStatusAction as _updateOrderStatusAction,
} from "./domain-actions/order-actions";

// Re-export from security-actions
import {
  getSecurityStatsAction as _getSecurityStatsAction,
  getLockdownStatusAction as _getLockdownStatusAction,
  toggleLockdownAction as _toggleLockdownAction,
  getSuperAdminWhitelistAction as _getSuperAdminWhitelistAction,
  updateSuperAdminWhitelistAction as _updateSuperAdminWhitelistAction,
  getMyIpAction as _getMyIpAction,
  getAuditLogsAction as _getAuditLogsAction,
} from "./domain-actions/security-actions";

// Re-export from notification-actions
import {
  broadcastNotificationAction as _broadcastNotificationAction,
  sendNotificationToUserAction as _sendNotificationToUserAction,
} from "./domain-actions/notification-actions";

// Re-export from page-actions
import {
  getPagesAction as _getPagesAction,
  getPageByIdAction as _getPageByIdAction,
  createPageAction as _createPageAction,
  updatePageAction as _updatePageAction,
  deletePageAction as _deletePageAction,
} from "./domain-actions/page-actions";

// --- ROLE & PERMISSION ACTIONS ---
export async function createPermissionAction(
  ...args: Parameters<typeof _createPermissionAction>
) {
  return _createPermissionAction(...args);
}
export async function updatePermissionAction(
  ...args: Parameters<typeof _updatePermissionAction>
) {
  return _updatePermissionAction(...args);
}
export async function deletePermissionAction(
  ...args: Parameters<typeof _deletePermissionAction>
) {
  return _deletePermissionAction(...args);
}
export async function getPermissionsAction(
  ...args: Parameters<typeof _getPermissionsAction>
) {
  return _getPermissionsAction(...args);
}
export async function assignPermissionsAction(
  ...args: Parameters<typeof _assignPermissionsAction>
) {
  return _assignPermissionsAction(...args);
}
export async function getRolesAction(
  ...args: Parameters<typeof _getRolesAction>
) {
  return _getRolesAction(...args);
}
export async function createRoleAction(
  ...args: Parameters<typeof _createRoleAction>
) {
  return _createRoleAction(...args);
}
export async function updateRoleAction(
  ...args: Parameters<typeof _updateRoleAction>
) {
  return _updateRoleAction(...args);
}
export async function deleteRoleAction(
  ...args: Parameters<typeof _deleteRoleAction>
) {
  return _deleteRoleAction(...args);
}

// --- USER ACTIONS ---
export async function getUsersAction(
  ...args: Parameters<typeof _getUsersAction>
) {
  return _getUsersAction(...args);
}
export async function createUserAction(
  ...args: Parameters<typeof _createUserAction>
) {
  return _createUserAction(...args);
}
export async function updateUserAction(
  ...args: Parameters<typeof _updateUserAction>
) {
  return _updateUserAction(...args);
}
export async function deleteUserAction(
  ...args: Parameters<typeof _deleteUserAction>
) {
  return _deleteUserAction(...args);
}
export async function assignRolesAction(
  ...args: Parameters<typeof _assignRolesAction>
) {
  return _assignRolesAction(...args);
}

// --- REVIEW ACTIONS ---
export async function getReviewsAction(
  ...args: Parameters<typeof _getReviewsAction>
) {
  return _getReviewsAction(...args);
}
export async function deleteReviewAction(
  ...args: Parameters<typeof _deleteReviewAction>
) {
  return _deleteReviewAction(...args);
}
export async function replyToReviewAction(
  ...args: Parameters<typeof _replyToReviewAction>
) {
  return _replyToReviewAction(...args);
}
export async function updateReviewStatusAction(
  ...args: Parameters<typeof _updateReviewStatusAction>
) {
  return _updateReviewStatusAction(...args);
}
export async function analyzeReviewSentimentAction(
  ...args: Parameters<typeof _analyzeReviewSentimentAction>
) {
  return _analyzeReviewSentimentAction(...args);
}

// --- METADATA ACTIONS (Brands, Categories, Coupons) ---
export async function getBrandsAction(
  ...args: Parameters<typeof _getBrandsAction>
) {
  return _getBrandsAction(...args);
}
export async function createBrandAction(
  ...args: Parameters<typeof _createBrandAction>
) {
  return _createBrandAction(...args);
}
export async function updateBrandAction(
  ...args: Parameters<typeof _updateBrandAction>
) {
  return _updateBrandAction(...args);
}
export async function deleteBrandAction(
  ...args: Parameters<typeof _deleteBrandAction>
) {
  return _deleteBrandAction(...args);
}
export async function getCategoriesAction(
  ...args: Parameters<typeof _getCategoriesAction>
) {
  return _getCategoriesAction(...args);
}
export async function createCategoryAction(
  ...args: Parameters<typeof _createCategoryAction>
) {
  return _createCategoryAction(...args);
}
export async function updateCategoryAction(
  ...args: Parameters<typeof _updateCategoryAction>
) {
  return _updateCategoryAction(...args);
}
export async function deleteCategoryAction(
  ...args: Parameters<typeof _deleteCategoryAction>
) {
  return _deleteCategoryAction(...args);
}
export async function getCouponsAction(
  ...args: Parameters<typeof _getCouponsAction>
) {
  return _getCouponsAction(...args);
}
export async function createCouponAction(
  ...args: Parameters<typeof _createCouponAction>
) {
  return _createCouponAction(...args);
}
export async function updateCouponAction(
  ...args: Parameters<typeof _updateCouponAction>
) {
  return _updateCouponAction(...args);
}
export async function deleteCouponAction(
  ...args: Parameters<typeof _deleteCouponAction>
) {
  return _deleteCouponAction(...args);
}

// --- PRODUCT & SKU ACTIONS ---
export async function getProductsAction(
  ...args: Parameters<typeof _getProductsAction>
) {
  return _getProductsAction(...args);
}
export async function createProductAction(
  ...args: Parameters<typeof _createProductAction>
) {
  return _createProductAction(...args);
}
export async function updateProductAction(
  ...args: Parameters<typeof _updateProductAction>
) {
  return _updateProductAction(...args);
}
export async function deleteProductAction(
  ...args: Parameters<typeof _deleteProductAction>
) {
  return _deleteProductAction(...args);
}
export async function getSkusAction(
  ...args: Parameters<typeof _getSkusAction>
) {
  return _getSkusAction(...args);
}
export async function updateSkuAction(
  ...args: Parameters<typeof _updateSkuAction>
) {
  return _updateSkuAction(...args);
}
export async function getProductTranslationsAction(
  ...args: Parameters<typeof _getProductTranslationsAction>
) {
  return _getProductTranslationsAction(...args);
}
export async function updateProductTranslationAction(
  ...args: Parameters<typeof _updateProductTranslationAction>
) {
  return _updateProductTranslationAction(...args);
}
export async function generateProductContentAction(
  ...args: Parameters<typeof _generateProductContentAction>
) {
  return _generateProductContentAction(...args);
}
export async function translateTextAction(
  ...args: Parameters<typeof _translateTextAction>
) {
  return _translateTextAction(...args);
}

// --- TENANT & SUBSCRIPTION ACTIONS ---
export async function getTenantsAction(
  ...args: Parameters<typeof _getTenantsAction>
) {
  return _getTenantsAction(...args);
}
export async function getTenantAction(
  ...args: Parameters<typeof _getTenantAction>
) {
  return _getTenantAction(...args);
}
export async function createTenantAction(
  ...args: Parameters<typeof _createTenantAction>
) {
  return _createTenantAction(...args);
}
export async function updateTenantAction(
  ...args: Parameters<typeof _updateTenantAction>
) {
  return _updateTenantAction(...args);
}
export async function deleteTenantAction(
  ...args: Parameters<typeof _deleteTenantAction>
) {
  return _deleteTenantAction(...args);
}
export async function getSubscriptionsAction(
  ...args: Parameters<typeof _getSubscriptionsAction>
) {
  return _getSubscriptionsAction(...args);
}
export async function cancelSubscriptionAction(
  ...args: Parameters<typeof _cancelSubscriptionAction>
) {
  return _cancelSubscriptionAction(...args);
}

// --- ANALYTICS ACTIONS ---
export async function getAnalyticsStatsAction(
  ...args: Parameters<typeof _getAnalyticsStatsAction>
) {
  return _getAnalyticsStatsAction(...args);
}
export async function getSalesDataAction(
  ...args: Parameters<typeof _getSalesDataAction>
) {
  return _getSalesDataAction(...args);
}
export async function getTopProductsAction(
  ...args: Parameters<typeof _getTopProductsAction>
) {
  return _getTopProductsAction(...args);
}
export async function getBlogStatsAction(
  ...args: Parameters<typeof _getBlogStatsAction>
) {
  return _getBlogStatsAction(...args);
}

// --- ORDER ACTIONS ---
export async function getOrdersAction(
  ...args: Parameters<typeof _getOrdersAction>
) {
  return _getOrdersAction(...args);
}
export async function getOrderDetailsAction(
  ...args: Parameters<typeof _getOrderDetailsAction>
) {
  return _getOrderDetailsAction(...args);
}
export async function updateOrderStatusAction(
  ...args: Parameters<typeof _updateOrderStatusAction>
) {
  return _updateOrderStatusAction(...args);
}

// --- SECURITY ACTIONS ---
export async function getSecurityStatsAction(
  ...args: Parameters<typeof _getSecurityStatsAction>
) {
  return _getSecurityStatsAction(...args);
}
export async function getLockdownStatusAction(
  ...args: Parameters<typeof _getLockdownStatusAction>
) {
  return _getLockdownStatusAction(...args);
}
export async function toggleLockdownAction(
  ...args: Parameters<typeof _toggleLockdownAction>
) {
  return _toggleLockdownAction(...args);
}
export async function getSuperAdminWhitelistAction(
  ...args: Parameters<typeof _getSuperAdminWhitelistAction>
) {
  return _getSuperAdminWhitelistAction(...args);
}
export async function updateSuperAdminWhitelistAction(
  ...args: Parameters<typeof _updateSuperAdminWhitelistAction>
) {
  return _updateSuperAdminWhitelistAction(...args);
}
export async function getMyIpAction(
  ...args: Parameters<typeof _getMyIpAction>
) {
  return _getMyIpAction(...args);
}
export async function getAuditLogsAction(
  ...args: Parameters<typeof _getAuditLogsAction>
) {
  return _getAuditLogsAction(...args);
}

// --- NOTIFICATION ACTIONS ---
export async function broadcastNotificationAction(
  ...args: Parameters<typeof _broadcastNotificationAction>
) {
  return _broadcastNotificationAction(...args);
}
export async function sendNotificationToUserAction(
  ...args: Parameters<typeof _sendNotificationToUserAction>
) {
  return _sendNotificationToUserAction(...args);
}

// --- PAGE ACTIONS ---
export async function getPagesAction(
  ...args: Parameters<typeof _getPagesAction>
) {
  return _getPagesAction(...args);
}
export async function getPageByIdAction(
  ...args: Parameters<typeof _getPageByIdAction>
) {
  return _getPageByIdAction(...args);
}
export async function createPageAction(
  ...args: Parameters<typeof _createPageAction>
) {
  return _createPageAction(...args);
}
export async function updatePageAction(
  ...args: Parameters<typeof _updatePageAction>
) {
  return _updatePageAction(...args);
}
export async function deletePageAction(
  ...args: Parameters<typeof _deletePageAction>
) {
  return _deletePageAction(...args);
}
