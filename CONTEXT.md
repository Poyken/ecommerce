# Dự án Ecommerce 2.0 - Multi-Tenant Platform

Tài liệu này là **Long-term Memory** của dự án. Cập nhật khi có quyết định quan trọng.

---

## 1. Tổng quan Dự án

**Mục tiêu**: Xây dựng nền tảng Ecommerce Multi-tenant SaaS cho phép nhiều cửa hàng (Tenant) hoạt động độc lập trên cùng một hạ tầng.

**Tech Stack**:

- **Backend**: NestJS 11, Prisma 6.2.1, PostgreSQL (+pgvector), Redis (ioredis), BullMQ
- **Frontend**: Next.js 16.1, React 19.2, TailwindCSS 4, Zustand 5, SWR 2.3
- **Infrastructure**: Docker Compose (ankane/pgvector, redis:7-alpine, api x2, web, worker)

---

## 2. Core Business Logic

### Customer Flow

1. User truy cập Storefront của Tenant (qua subdomain hoặc custom domain).
2. Đăng ký/Đăng nhập (hỗ trợ Social Login: Google, Facebook, 2FA với otplib).
3. Duyệt sản phẩm (Semantic Search qua AI, Filter giá nhanh với denormalized min/max price).
4. Thêm vào giỏ hàng (Cart) -> Checkout.
5. Thanh toán (COD, MOMO, VNPAY, STRIPE).
6. Theo dõi đơn hàng (Order statuses: PENDING -> PROCESSING -> SHIPPED -> DELIVERED).
7. Đánh giá sản phẩm (Review + AI Sentiment analysis).
8. Đổi trả hàng (RMA Flow: Return Request -> Inspection -> Refund).

### Admin Flow

1. Quản lý Catalog: Category, Brand, Product, SKU (đa biến thể: Màu, Size, v.v.).
2. Quản lý Inventory: Multi-warehouse, InventoryItem, StockLogs.
3. Quản lý Khuyến mãi: Promotion Rules-Action Engine (Discount %, Fixed, Free Shipping, BuyXGetY).
4. Quản lý Đơn hàng: Order status tracking, Shipment (partial fulfillment), Payment history.
5. Quản lý User: Customer Groups (VIP, Wholesale), Price Lists (B2B pricing).
6. Quản lý CMS: Blog (Affiliate tracking), Pages.
7. Báo cáo/Thống kê: Real-time Analytics Dashboard.

---

## 3. Database Schema Highlights (~1800 lines)

| Entity                                      | Mục đích                                        |
| ------------------------------------------- | ----------------------------------------------- |
| `Tenant`                                    | Cửa hàng (SaaS multi-tenancy)                   |
| `User`                                      | Người dùng (Customer, Admin)                    |
| `Role, Permission`                          | RBAC (Phân quyền động)                          |
| `Product, SKU, ProductOption, OptionValue`  | Sản phẩm đa biến thể (Min/Max Price Caching)    |
| `Category, Brand`                           | Phân loại sản phẩm (Slug-based lookup)          |
| `Warehouse, InventoryItem, InventoryLog`    | Quản lý tồn kho đa kho                          |
| `Cart, CartItem`                            | Giỏ hàng                                        |
| `Order, OrderItem, Payment`                 | Đơn hàng & Thanh toán (Historical Snapshots)    |
| `Shipment, ShipmentItem`                    | Giao hàng (Partial Fulfillment)                 |
| `Promotion, PromotionRule, PromotionAction` | Rule Engine cho khuyến mãi                      |
| `LoyaltyPoint`                              | Tích điểm khách hàng (Earned/Redeemed/Refunded) |
| `AuditLog`                                  | Nhật ký hoạt động (Partitioned storage)         |
| `OutboxEvent`                               | Transactional Outbox Pattern for jobs           |

---

## 4. Quyết định Kiến trúc (ADR)

- **ADR-001**: Sử dụng **Multi-tenant với Shared Database** (mỗi table có `tenantId`).
- **ADR-002**: Dùng **Prisma** làm ORM duy nhất, enable `fullTextSearchPostgres` và pgvector.
- **ADR-003**: **Zod-First Validation**: Loại bỏ hoàn toàn class-validator, dùng Zod cho API (nestjs-zod) và Web.
- **ADR-004**: **Soft Delete** cho mọi entity quan trọng (deletedAt column).
- **ADR-005**: API Scalable với Docker Compose `replicas: 2` và Redis-based Caching (L1/L2).
- **ADR-006**: Frontend dùng **Next.js Server Actions** + `next-safe-action` wrapper cho bảo mật.
- **ADR-007**: **Transactional Outbox Pattern**: Đảm bảo Zero Data Loss khi đẩy jobs vào BullMQ.
- **ADR-008**: **Domain Modules Consolidation**: Gom nhóm tính năng thành `CatalogModule`, `SalesModule`, `AiModule`.

---

## 5. Các API Modules Hiện Có

| Domain       | Modules                                                                                         |
| ------------ | ----------------------------------------------------------------------------------------------- |
| **Catalog**  | `catalog` (categories, brands, products, skus)                                                  |
| **Sales**    | `sales` (orders, cart, payment, invoices, shipping)                                             |
| **AI**       | `ai` (chat, agent, insights, rag, images)                                                       |
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
