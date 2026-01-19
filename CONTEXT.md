# Dự án Ecommerce 2.0 - Multi-Tenant Platform

Tài liệu này là **Long-term Memory** của dự án. Cập nhật khi có quyết định quan trọng.

---

## 1. Tổng quan Dự án

**Mục tiêu**: Xây dựng nền tảng Ecommerce Multi-tenant SaaS cho phép nhiều cửa hàng (Tenant) hoạt động độc lập trên cùng một hạ tầng.

**Tech Stack**:

- **Backend**: NestJS 11, Prisma 6, PostgreSQL (+pgvector), Redis, BullMQ
- **Frontend**: Next.js 16, React 19, TailwindCSS 4, Zustand, SWR
- **Infrastructure**: Docker Compose (Postgres, Redis, API x2, Web, Worker)

---

## 2. Core Business Logic

### Customer Flow

1. User truy cập Storefront của Tenant (qua subdomain hoặc custom domain).
2. Đăng ký/Đăng nhập (hỗ trợ Social Login: Google, Facebook).
3. Duyệt sản phẩm (theo Category, Brand, Filter giá).
4. Thêm vào giỏ hàng (Cart) -> Checkout.
5. Thanh toán (COD, MOMO, VNPAY, STRIPE).
6. Theo dõi đơn hàng (Order statuses: PENDING -> PROCESSING -> SHIPPED -> DELIVERED).
7. Đánh giá sản phẩm (Review + AI Sentiment analysis).
8. Đổi trả hàng (RMA Flow: Return Request -> Inspection -> Refund).

### Admin Flow

1. Quản lý Catalog: Category, Brand, Product, SKU (đa biến thể: Màu, Size, v.v.).
2. Quản lý Inventory: Multi-warehouse, InventoryItem, StockLogs.
3. Quản lý Khuyến mãi: Promotion Rules/Actions (Discount %, Fixed, Free Shipping).
4. Quản lý Đơn hàng: Order status tracking, Shipment (partial fulfillment), Payment history.
5. Quản lý User: Customer Groups (VIP, Wholesale), Price Lists (B2B pricing).
6. Quản lý CMS: Blog, Pages.
7. Báo cáo/Thống kê: StoreMetrics, Analytics.

---

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
- **ADR-008**: **Domain Modules Consilidation** (`SalesModule`, `CatalogModule`, `AiModule`) to reduce `AppModule` noise.

---

## 5. Các API Modules Hiện Có

| Domain       | Modules                                                                                         |
| ------------ | ----------------------------------------------------------------------------------------------- |
| **Catalog**  | `catalog` (categories, brands, products, skus)                                                  |
| **Sales**    | `orders`, `cart`, `payment`, `invoices`, `shipping`                                             |
| **AI**       | `ai-chat`, `agent`, `insights`, `rag`, `images`                                                 |
| **Identity** | `auth`, `users`, `tenants`, `roles`                                                             |
| **Others**   | `promotions`, `return-requests`, `inventory`, `loyalty`, `reviews`, `webhooks`, `blog`, `pages` |

---

## 6. Roadmap Tiếp Theo (TODO)

- [ ] Hoàn thiện Core: Cart, Checkout, Order, Payment
- [ ] Stabilize Inventory Management
- [ ] Complete RMA/Return flow
- [ ] AI Chatbot Integration
- [ ] SEO Optimization for Storefront
- [ ] Admin Dashboard UI/UX Enhancement

## Changelog

- [2026-01-19] API Validation Refactoring: Removed class-validator/class-transformer, migrated to Zod (nestjs-zod), fixed build errors.
- [2026-01-19] Architecture Refactoring: Consolidated API modules into Domain Modules (Sales, Catalog, AI), and optimized Web Products Hooks (SWR).
