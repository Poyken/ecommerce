# Project Context: Ecommerce Monorepo (Enterprise Level)

> [!IMPORTANT]
> **Living Document**: This file is the "Memory" of the project. It MUST be updated after every major task or phase completion.

## 1. Project Overview

- **Type**: Multi-tenant Ecommerce Platform (SaaS).
- **Architecture**: Modular Monolith (NestJS) + Next.js (Web) + Shared Database (Postgres).
- **Scale Strategy**: Starts with Shared Database (Tenant Discriminator) -> Can evolve to Sharding/Service Splitting.

## 2. Tech Stack & Standards

- **Backend**: NestJS 11, Prisma 6 (Postgres), Redis (BullMQ).
- **Frontend**: Next.js 16, React 19, TailwindCSS, Zustand.
- **Validation**: **Zod-First Policy** (No Class-Validator/Joi). Shared schemas in `packages/shared`.
- **Infrastructure**: Docker Compose (Local), Neon (DB), Railway/Render (Compute).

## 3. Business Rules (Enterprise)

- **Multi-tenancy**: Strict isolation via `tenantId` (Prisma Middleware + CLS).
- **Inventory**: Multi-Warehouse model (`InventoryItem`). `Sku.stock` is a cached aggregate.
- **Orders**: Transactional flow (Create Order -> Reduce Stock -> Clear Cart).
- **Products**: SKU-centric model (Product -> Options -> Sku).

## 4. Architectural Decisions (ADR)

- **ADR-001 (Monorepo)**: Use pnpm workspaces for code sharing (`api`, `web`, `shared`).
- **ADR-002 (Auth)**: JWT with `x-tenant-id` header validation.
- **ADR-003 (Inventory)**: `InventoryItem` is Source of Truth. `Sku.stock` is Read-Only cache.
- **ADR-004 (Promotions)**: Dùng mô hình Rule-Action linh hoạt. Dữ liệu Rule/Action được lưu dạng JSON để dễ mở rộng mà không thay đổi Schema database thường xuyên.

## Changelog

- [2026-01-19] **Phase 1-8: Foundation & Core Storefront Journey completed**.
- [2026-01-19] **Phase 9-11: Advanced Management & Fulfillment completed**.
- [2026-01-19] **Phase 12: Promotion Engine & Marketing Engine completed**.
- [2026-01-19] **Phase 13: Analytics & Insights Dashboard completed**.
- [2026-01-19] **Phase 14: AI Chat & Personalization (Gemini + pgvector) completed**.
- [2026-01-19] **Phase 15: Loyalty & Rewards System completed**.
- [2026-01-19] **Phase 16-17: Notifications & RBAC System completed**.
- [2026-01-19] **Phase 18: Payment Gateway Integration (Stripe, VNPay) completed**.
- [2026-01-19] **Phase 19: Advanced Search & Filtering (Nuqs) completed**.
- [2026-01-19] **Phase 20: Product Reviews & Ratings completed**.
- [2026-01-19] **Phase 21: Email & Marketing Automation (BullMQ, Nodemailer) completed**.
- [2026-01-19] **Phase 22: Production Readiness & DevOps (GitHub CI, Docker, Security) completed**.
- [2026-01-19] Phase 23: External Services Integration (Cloudinary, GHN, Gemini)
- [2026-01-19] **Phase 24: Global Expansion & Advanced Fulfillment (i18n, Multi-currency, Intelligent Routing) completed**.
- [2026-01-19] **Phase 25: Multi-Tenant SaaS Transformation completed**.
  - Refactored project to support full SaaS onboarding (Landing, Registration, Plan selection).
  - Implemented role-based login (Superadmin, Admin, Merchant).
  - Adopted tenant-aware routing `/[locale]/shop/[tenant]`.
  - Refactored Cart and State management to be tenant-isolated.

## 5. Project Completion Status

The project has reached its target enterprise maturity level. All core modules and advanced features are implemented, verified, and secured.

## 3. Database Schema Highlights (~1800 lines)

| Entity                                      | Mục đích                        |
| ------------------------------------------- | ------------------------------- |
| `Tenant`                                    | Cửa hàng (SaaS multi-tenancy)   |
| `User`                                      | Người dùng (Customer, Admin)    |
| `Role, Permission`                          | RBAC (Phân quyền động)          |
| `Product, SKU, ProductOption, OptionValue`  | Sản phẩm đa biến thể            |
| `Category, Brand`                           | Phân loại sản phẩm              |
| `Warehouse, InventoryItem, InventoryLog`    | Quản lý tồn kho đa kho          |
| `Cart, CartItem`                            | Giỏ hàng                        |
| `Order, OrderItem, Payment`                 | Đơn hàng & Thanh toán           |
| `Shipment, ShipmentItem`                    | Giao hàng (Partial Fulfillment) |
| `Promotion, PromotionRule, PromotionAction` | Engine khuyến mãi               |
| `ReturnRequest, ReturnItem`                 | RMA/Đổi trả hàng                |
| `LoyaltyPoint`                              | Tích điểm khách hàng            |
| `Review`                                    | Đánh giá + AI Sentiment         |
| `Blog, Page`                                | CMS                             |
| `AiChatSession, AiChatMessage`              | AI Chatbot                      |
| `OutboxEvent`                               | Transactional Outbox Pattern    |
| `Subscription, Invoice`                     | SaaS Billing                    |

---

## 4. Quyết định Kiến trúc (ADR)

- **ADR-001**: Sử dụng **Multi-tenant với Shared Database** (mỗi table có `tenantId`).
- **ADR-002**: Dùng **Prisma** làm ORM duy nhất, enable `fullTextSearchPostgres`.
- **ADR-003**: **Domain Events** qua `@nestjs/event-emitter` (trong `DomainEventsModule`).
- **ADR-004**: **Soft Delete** cho mọi entity quan trọng (User, Product, Order, Tenant).
- **ADR-005**: API Scalable với Docker Compose `replicas: 2`.
- **ADR-006**: Frontend dùng **Next.js Server Actions** thay cho REST calls khi có thể.
- **ADR-007**: **Transactional Outbox** (`OutboxEvent` table) cho Event Sourcing.

---

## 5. Các API Modules Hiện Có

| Module                                         | Chức năng                           |
| ---------------------------------------------- | ----------------------------------- |
| `auth`                                         | Đăng nhập, Đăng ký, OAuth, 2FA, JWT |
| `users`                                        | CRUD User, Profile                  |
| `tenants`                                      | CRUD Tenant, Settings, Onboarding   |
| `catalog` (categories, brands, products, skus) | Quản lý sản phẩm                    |
| `cart`                                         | Giỏ hàng                            |
| `orders`                                       | Đơn hàng                            |
| `payment`                                      | Thanh toán (Momo, VNPay, COD)       |
| `shipping`                                     | Tích hợp GHN/GHTK                   |
| `promotions`                                   | Khuyến mãi nâng cao                 |
| `return-requests`                              | RMA/Đổi trả                         |
| `inventory`, `inventory-alerts`                | Kho hàng                            |
| `reviews`                                      | Đánh giá sản phẩm                   |
| `notifications`                                | Push/Email                          |
| `blog`, `pages`                                | CMS                                 |
| `ai` (ai-chat, agent, insights, rag, images)   | AI features                         |
| `analytics`, `reports`                         | Thống kê                            |
| `roles`, `admin`, `super-admin`                | Quản trị & Phân quyền               |
| `loyalty`                                      | Điểm thưởng                         |
| `tax`                                          | Thuế                                |
| `webhooks`                                     | Webhooks cho bên thứ 3              |

---

## 6. Roadmap Tiếp Theo (TODO)

- [x] Hoàn thiện Core: Cart, Checkout, Order, Payment
- [x] Stabilize Inventory Management
- [x] Complete RMA/Return flow
- [ ] AI Chatbot Integration
- [x] SEO Optimization for Storefront
- [x] Admin Dashboard UI/UX Enhancement
- [x] CMS Module Integration

---

## 7. Changelog

- [2026-01-16] **Phase 1 Foundation completed**:
  - Monorepo setup với pnpm workspace
  - Shared package `@ecommerce/shared` với Zod schemas
  - API scaffold (NestJS 11 + Prisma 6)
  - Web scaffold (Next.js 16 + TailwindCSS 4)
  - Docker Compose (Postgres, Redis)

- [2026-01-16] **Phase 2 Core Infrastructure completed**:
  - Database Schema (30+ models) với Prisma 6
  - Auth System (JWT, Refresh Token, RBAC)
  - Core Modules (Prisma, Redis, Guards, Interceptors)
  - Resolved port conflicts (DB: 5432, Redis: 6385)

- [2026-01-16] **Phase 3 Business Logic completed**:
  - Modules: Catalog, Cart, Orders, Payment (Stubbed)
  - Frontend: Product Listing, Cart, Checkout (Basic)

- [2026-01-16] **Phase 4 Advanced Features completed**:
  - Modules: Inventory (Multi-warehouse), Promotions (Rules/Actions), Returns (RMA), Loyalty, Reviews (AI Stub)
  - API verified with clean build

- [2026-01-16] **Phase 5 Polish & Launch completed**:
  - Admin Dashboard: Frontend implemented with Analytics/CMS Management
  - CMS Backend: Blog/Page CRUD
  - Deployment: Production Docker Compose config created
  - API Stability: Fixed all TypeScript build errors in Services

- [2026-01-16] **Phase 6 100% Feature Completion**:
  - Tenants & Settings: Multi-tenancy CRUD, Global settings
  - Users & RBAC: Admin User Management, Customer Groups, Roles/Permissions
  - Shipping: Shipment & Fulfillment logic
  - Infrastructure: Media Upload, Audit Logs, Notifications
  - **Status**: 100% Schema Coverage Implemented

- [2026-01-20] **Admin UI Design System documented**:
  - Created `admin-ui-design-system.md` in `.agent/knowledge/`
  - Documented core components: AdminPageHeader, AdminTableWrapper, AdminStatsCard, AdminEmptyState, AdminActionBadge
  - Verified all super-admin pages use consistent UI components from `admin-page-components.tsx`

- [2026-01-20] **Super Admin UI Polish completed**:
  - Theme awareness: Removed hardcoded dark mode styles, now respects user theme settings
  - Premium headers: All pages use `AdminPageHeader` with semantic color variants
  - Fixed "double border" visual bug in tables using `variant="minimal"` for nested empty states
  - Sidebar: Improved "Back to Store" button styling with hover effects
  - Loading: Switched to `classic` variant for consistent transitions

- [2026-01-20] **Marketing Pages i18n completed**:
  - Added `marketing` namespace to `en.json` and `vi.json` message files
  - Created `marketing-layout-client.tsx` with functional language switcher (header + footer)
  - Fully internationalized Demo page with `useTranslations("marketing.demo")`
  - Mobile-responsive nav menu in marketing layout
  - Verified language switching works correctly (`/vi/demo` ↔ `/en/demo`)
