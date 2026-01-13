export enum AppPermission {
  // Analytics
  ANALYTICS_READ = 'analytics:read',

  // Reports
  REPORTS_EXPORT = 'reports:export',

  // Inventory & Alerts
  INVENTORY_ALERTS_MANAGE = 'inventory-alerts:manage',

  // Subscriptions (SaaS)
  SUBSCRIPTION_MANAGE = 'subscription:manage',
  SUBSCRIPTION_READ = 'subscription:read',

  // Loyalty
  LOYALTY_MANAGE = 'loyalty:manage',
  LOYALTY_READ = 'loyalty:read',

  // Procurement
  PROCUREMENT_MANAGE = 'procurement:manage',

  // Fulfillment
  FULFILLMENT_MANAGE = 'fulfillment:manage',

  // Tax
  TAX_MANAGE = 'tax:manage',

  // Dev Tools (Only for Development)
  DEV_TOOLS_ACCESS = 'dev-tools:access',

  // General Admin
  ADMIN_ALL = 'admin:all',
}
