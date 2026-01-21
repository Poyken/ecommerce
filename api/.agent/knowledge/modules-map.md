# API Modules Map

Tài liệu này liệt kê tất cả modules trong `api/src/` và mối quan hệ giữa chúng.

---

## 1. Domain Modules (Consolidated)

### CatalogModule (`src/catalog/`)

Quản lý sản phẩm và danh mục.

| Sub-module   | Path                  | Purpose           |
| ------------ | --------------------- | ----------------- |
| `brands`     | `catalog/brands/`     | Thương hiệu       |
| `categories` | `catalog/categories/` | Danh mục (nested) |
| `products`   | `catalog/products/`   | Sản phẩm chính    |
| `skus`       | `catalog/skus/`       | Biến thể (SKU)    |

---

### SalesModule (`src/sales/`)

Quản lý đơn hàng và thanh toán.

| Sub-module | Path              | Purpose                       |
| ---------- | ----------------- | ----------------------------- |
| `cart`     | `sales/cart/`     | Giỏ hàng                      |
| `orders`   | `sales/orders/`   | Đơn hàng                      |
| `payment`  | `sales/payment/`  | Thanh toán (MOMO, VNPAY, COD) |
| `invoices` | `sales/invoices/` | Hóa đơn                       |
| `shipping` | `sales/shipping/` | Tính phí vận chuyển (GHN)     |

---

### AiModule (`src/ai/`)

AI và Machine Learning features.

| Feature    | Purpose          |
| ---------- | ---------------- |
| `chat`     | AI Chatbot (RAG) |
| `insights` | Product insights |
| `images`   | Image processing |

---

## 2. Identity & Auth

| Module          | Path           | Purpose                     |
| --------------- | -------------- | --------------------------- |
| `AuthModule`    | `src/auth/`    | JWT Auth, MFA, Social Login |
| `UsersModule`   | `src/users/`   | User CRUD, Profile          |
| `RolesModule`   | `src/roles/`   | RBAC Roles & Permissions    |
| `TenantsModule` | `src/tenants/` | Multi-tenant management     |

---

## 3. Infrastructure (Core)

| Module             | Path               | Purpose            |
| ------------------ | ------------------ | ------------------ |
| `PrismaModule`     | `core/prisma/`     | Database ORM       |
| `RedisModule`      | `core/redis/`      | Cache & Queue      |
| `SentryModule`     | `core/sentry/`     | Error tracking     |
| `MetricsModule`    | `core/metrics/`    | Prometheus metrics |
| `DataLoaderModule` | `core/dataloader/` | N+1 prevention     |

---

## 4. Support Modules

| Module                  | Path                    | Purpose                                |
| ----------------------- | ----------------------- | -------------------------------------- |
| `InventoryModule`       | `src/inventory/`        | Multi-warehouse stock                  |
| `InventoryAlertsModule` | `src/inventory-alerts/` | Low stock alerts (**Merge candidate**) |
| `PromotionsModule`      | `src/promotions/`       | Discount rules engine                  |
| `LoyaltyModule`         | `src/loyalty/`          | Points system                          |
| `ReviewsModule`         | `src/reviews/`          | Product reviews                        |
| `NotificationsModule`   | `src/notifications/`    | Push/Email                             |
| `WishlistModule`        | `src/wishlist/`         | User wishlists                         |

---

## 5. Operations

| Module                 | Path                   | Purpose           |
| ---------------------- | ---------------------- | ----------------- |
| `FulfillmentModule`    | `src/fulfillment/`     | Order fulfillment |
| `ProcurementModule`    | `src/procurement/`     | Purchase orders   |
| `ReturnRequestsModule` | `src/return-requests/` | RMA handling      |
| `TaxModule`            | `src/tax/`             | Tax calculation   |

---

## 6. Admin & Platform

| Module             | Path               | Purpose              |
| ------------------ | ------------------ | -------------------- |
| `AdminModule`      | `src/admin/`       | Admin dashboard APIs |
| `SuperAdminModule` | `src/super-admin/` | Platform owner APIs  |
| `AnalyticsModule`  | `src/analytics/`   | Business analytics   |
| `ReportsModule`    | `src/reports/`     | Report generation    |
| `AuditModule`      | `src/audit/`       | Audit logs           |

---

## 7. Integrations

| Module             | Path                       | Purpose             |
| ------------------ | -------------------------- | ------------------- |
| `CloudinaryModule` | `integrations/cloudinary/` | Image upload        |
| `NewsletterModule` | `integrations/newsletter/` | Email subscriptions |
| `SitemapModule`    | `integrations/sitemap/`    | SEO sitemap         |

---

## 8. CMS & Marketing

| Module        | Path         | Purpose          |
| ------------- | ------------ | ---------------- |
| `BlogModule`  | `src/blog/`  | Blog posts       |
| `PagesModule` | `src/pages/` | Static pages     |
| `MediaModule` | `src/media/` | Media management |

---

## 9. SaaS Features

| Module                 | Path                   | Purpose            |
| ---------------------- | ---------------------- | ------------------ |
| `PlansModule`          | `src/plans/`           | Subscription plans |
| `SubscriptionModule`   | `src/subscription/`    | Billing management |
| `CustomerGroupsModule` | `src/customer-groups/` | B2B groups         |

---

## 10. Utilities

| Module               | Path                    | Purpose               |
| -------------------- | ----------------------- | --------------------- |
| `CommonModule`       | `src/common/`           | Shared utilities      |
| `WorkerModule`       | `src/worker/`           | Background jobs       |
| `WebhooksModule`     | `src/webhooks/`         | Webhook handlers      |
| `ChatModule`         | `src/chat/`             | Live chat (WebSocket) |
| `DevToolsModule`     | `src/dev-tools/`        | Development utilities |
| `FeatureFlagsModule` | `common/feature-flags/` | Feature toggles       |
| `AddressesModule`    | `src/addresses/`        | Address management    |

---

## Module Count Summary

- **Total Modules**: 41
- **Consolidated Domain Modules**: 3 (Catalog, Sales, AI)
- **Merge Candidates**: `inventory-alerts` → `inventory`
