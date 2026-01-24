# Database Schema Reference

Tài liệu này chứa toàn bộ kiến thức về Database Schema của dự án Ecommerce.

---

## 1. Tổng quan

- **ORM**: Prisma 6+
- **Database**: PostgreSQL + pgvector (vector search)
- **Pattern**: Multi-tenant (Shared Database với `tenantId`)
- **Soft Delete**: Tất cả entity quan trọng có `deletedAt`
- **Missing Models**: None. (Synced)

---

## 2. Core Entities

### Multi-tenancy

| Model            | Mô tả                                                                 |
| ---------------- | --------------------------------------------------------------------- |
| `Tenant`         | Cửa hàng (SaaS). Có subdomain, customDomain, plan, settings.          |
| `TenantSettings` | Cấu hình riêng: loyalty ratio, shipping fee, free shipping threshold. |

### Users & Auth

| Model                                          | Mô tả                                                       |
| ---------------------------------------------- | ----------------------------------------------------------- |
| `User`                                         | Người dùng. Có 2FA, social login, referral, loyalty points. |
| `Role`                                         | Vai trò (Admin, Staff, Customer).                           |
| `Permission`                                   | Quyền hạn cụ thể (PRODUCT_CREATE, ORDER_VIEW).              |
| `UserRole`, `RolePermission`, `UserPermission` | Bảng liên kết RBAC.                                         |
| `Address`                                      | Địa chỉ giao hàng (có tích hợp GHN/GHTK IDs).               |

### Catalog

| Model                      | Mô tả                                                               |
| -------------------------- | ------------------------------------------------------------------- |
| `Category`                 | Danh mục (hỗ trợ nested với `parentId`).                            |
| `Brand`                    | Thương hiệu.                                                        |
| `Product`                  | Sản phẩm chính. Có SEO fields, avgRating, reviewCount.              |
| `ProductOption`            | Tùy chọn (Màu sắc, Size).                                           |
| `OptionValue`              | Giá trị tùy chọn (Đỏ, Xanh, S, M, L).                               |
| `SKU`                      | Biến thể sản phẩm (Stock Keeping Unit). Có price, salePrice, stock. |
| `ProductImage`, `SkuImage` | Ảnh sản phẩm/biến thể.                                              |
| `ProductTranslation`       | Đa ngôn ngữ.                                                        |

### Inventory

| Model           | Mô tả                                 |
| --------------- | ------------------------------------- |
| `Warehouse`     | Kho hàng (hỗ trợ multi-warehouse).    |
| `InventoryItem` | Tồn kho của SKU trong từng Warehouse. |
| `InventoryLog`  | Lịch sử biến động kho.                |

### Orders & Payments

| Model                      | Mô tả                                                         |
| -------------------------- | ------------------------------------------------------------- |
| `Cart`, `CartItem`         | Giỏ hàng.                                                     |
| `Order`                    | Đơn hàng. Có đầy đủ status flow, VAT info, shipping snapshot. |
| `OrderItem`                | Chi tiết đơn hàng (lưu cứng giá, tên tại thời điểm mua).      |
| `Payment`                  | Lịch sử thanh toán (MOMO, VNPAY, COD).                        |
| `Shipment`, `ShipmentItem` | Giao hàng (Partial Fulfillment).                              |

### Promotions

| Model             | Mô tả                                           |
| ----------------- | ----------------------------------------------- |
| `Promotion`       | Chương trình khuyến mãi.                        |
| `PromotionRule`   | Điều kiện (MIN_ORDER_VALUE, SPECIFIC_CATEGORY). |
| `PromotionAction` | Hành động (DISCOUNT_PERCENT, FREE_SHIPPING).    |
| `PromotionUsage`  | Lịch sử sử dụng.                                |

### Returns (RMA)

| Model           | Mô tả                                            |
| --------------- | ------------------------------------------------ |
| `ReturnRequest` | Yêu cầu đổi trả. Có type, method, refund method. |
| `ReturnItem`    | Chi tiết sản phẩm trả.                           |

### CMS & Blog

| Model  | Mô tả                                             |
| ------ | ------------------------------------------------- |
| `Blog` | Bài viết. Có affiliate tracking (referredOrders). |
| `Page` | Trang tĩnh (About, Policy).                       |

### Loyalty & Customer

| Model                        | Mô tả                                   |
| ---------------------------- | --------------------------------------- |
| `CustomerGroup`              | Nhóm khách (VIP, Wholesale).            |
| `PriceList`, `PriceListItem` | Bảng giá B2B.                           |
| `LoyaltyPoint`               | Tích điểm (EARNED, REDEEMED, REFUNDED). |

### AI & Chat

| Model                             | Mô tả                                |
| --------------------------------- | ------------------------------------ |
| `AiChatSession`, `AiChatMessage`  | AI Chatbot.                          |
| `ChatConversation`, `ChatMessage` | Live chat support.                   |
| `Review`                          | Đánh giá (có AI sentiment analysis). |

### Infrastructure

| Model             | Mô tả                                     |
| ----------------- | ----------------------------------------- |
| `Media`           | Quản lý file upload.                      |
| `AuditLog`        | Nhật ký hoạt động (partitioned by month). |
| `OutboxEvent`     | Transactional Outbox Pattern.             |
| `FeatureFlag`     | Feature toggles.                          |
| `Notification`    | Push/Email notifications.                 |
| `PlatformSetting` | System-wide settings (Json value).        |

### SaaS Billing

| Model                                            | Mô tả                   |
| ------------------------------------------------ | ----------------------- |
| `Subscription`                                   | Gói đăng ký của Tenant. |
| `Invoice`                                        | Hóa đơn.                |
| `Supplier`, `PurchaseOrder`, `PurchaseOrderItem` | Nhập hàng.              |

---

## 3. Enums quan trọng

```prisma
enum OrderStatus { PENDING, PROCESSING, SHIPPED, DELIVERED, CANCELLED, RETURNED, COMPLETED }
enum PaymentStatus { UNPAID, PENDING, PAID, FAILED, REFUNDED }
enum ShipmentStatus { PENDING, READY_TO_SHIP, SHIPPED, DELIVERED, FAILED, RETURNED }
enum ReturnStatus { PENDING, APPROVED, WAITING_FOR_RETURN, IN_TRANSIT, RECEIVED, INSPECTING, REFUNDED, REJECTED, CANCELLED }
enum ReturnType { REFUND_ONLY, RETURN_AND_REFUND, EXCHANGE }
enum LoyaltyPointType { EARNED, REDEEMED, REFUNDED }
enum Sentiment { POSITIVE, NEGATIVE, NEUTRAL }
enum TenantPlan { BASIC, PRO, ENTERPRISE }
```

---

## 4. Index Strategy

- Mọi table có `@@index([tenantId])` để lọc theo Tenant.
- Các field tìm kiếm nhiều: `email`, `slug`, `skuCode`, `status`.
- Composite indexes cho queries phổ biến: `[tenantId, status, createdAt]`.
- GIN index cho JSON fields: `metadata`, `payload`.
