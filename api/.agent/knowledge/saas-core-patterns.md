# SaaS Core Design Patterns

> **Purpose**: Deep dive into the "Secret Sauce" of the e-commerce platform.  
> **Target**: Senior Fullstack Engineers

---

## 1. Multi-Tenancy Isolation

Hệ thống sử dụng mô hình **Shared Database** với cơ chế cô lập dữ liệu tại tầng Application.

### 1.1 Tenant Resolution Engine

Resolution diễn ra sớm nhất có thể trong request lifecycle:

1. **Middleware**: Trích xuất Host (hoặc `x-tenant-id`) -> Lookup Tenant ID trong Redis/DB.
2. **Context Persistence**: Sử dụng `AsyncLocalStorage` (Node.js builtin) thông qua `tenantStorage` để lưu `tenantId` cho toàn bộ request lifecycle.
3. **Implicit Filtering & RLS**:
   - NestJS Middleware thiết lập session variable trong Postgres: `SET app.current_tenant_id = 'tenant-id'`.
   - Database Policies (RLS) sẽ chặn truy cập trái phép ngay cả khi query bị thiếu `where` clause.
   - Prisma Extension tự động inject `tenantId` vào `where` clause cho các models liên quan.

### 1.2 Custom Domains resolution

Dự án hỗ trợ CNAME/A record mapping:

- `tenant-a.saas.com` (Subdomain)
- `custom-domain.com` (Mapped via DNS)
- Cả hai đều Resolve về cùng một `tenantId`.

---

## 2. Transactional Outbox Pattern

Để đảm bảo tính nhất quán cuối cùng (Eventual Consistency) giữa DB và Redis (BullMQ), chúng ta không enqueue job trực tiếp trong business logic.

### 2.1 The Workflow

1. **Business Transaction**: Cập nhật DB (ví dụ: tạo Order) + Ghi event vào bảng `OutboxEvent` trong CÙNG một transaction.
2. **Poll/Notify**: Một background process quét bảng `OutboxEvent`.
3. **Reliable Enqueue**: Đẩy event sang BullMQ. Sau khi thành công, đánh dấu `OutboxEvent` là `processed`.

**Lợi ích**: Nếu Redis down, Job sẽ không bị mất. Nó sẽ được retry từ bước DB.

---

## 3. Atomic Concurrency Control (Inventory)

Overselling là lỗi nghiêm trọng nhất trong E-commerce. Chúng ta xử lý tại tầng Database.

### 3.1 Inventory Reservation logic

Sử dụng **SELECT ... FOR UPDATE** để lock row tại tầng Database, đảm bảo việc kiểm tra tồn kho và cập nhật diễn ra nguyên tử (Atomic):

1. **Lock row**: `SELECT ... FROM Sku WHERE id = :id FOR UPDATE`
2. **Check & Update**: Kiểm tra `stock >= :qty` và thực hiện `update` trong cùng transaction.

Nếu kho không đủ, throw lỗi ngay lập tức để Rollback transaction. Điều này an toàn hơn so với việc kiểm tra bằng code thuần túy (Race condition).

---

## 4. Automated Soft Delete

Hệ thống bảo vệ dữ liệu bằng cách không bao giờ thực hiện xóa cứng (Hard Delete) đối với các thực thể quan trọng.

### 4.1 Prisma Interceptor Transform

Mọi lệnh `delete` hoặc `deleteMany` được Prisma Extension tự động chuyển thành `update` với logic:

- `deletedAt = new Date()`
- Query tự động thêm `deletedAt: null` vào `where` clause để ẩn các mục đã xóa khỏi UI.

### 4.2 Restoring Data

Việc khôi phục dữ liệu chỉ đơn giản là set `deletedAt = null` thông qua Admin Panel.

---

## 5. Historical Snapshots

Master Data (Product price, name) đổi thay đổi theo thời gian. Đơn hàng PHẢI giữ được trạng thái lúc mua.

### 4.1 Implementation Pattern

Khi tạo `OrderItem`, chúng ta KHÔNG chỉ lưu `productId`. Chúng ta lưu:

- `priceAtPurchase`: Giá tại thời điểm đó.
- `skuNameSnapshot`: Tên sản phẩm + Option (ví dụ: "iPhone 15 - Blue - 256GB").
- `shippingAddressSnapshot`: Địa chỉ lúc đặt hàng (ngay cả khi User đổi địa chỉ sau này).

---

## 5. Standard Error Handling & StandardResponse

Để Frontend (Senior Dev) có thể tin cậy vào API:

- **Consistent Structure**: Luôn trả về `{ success, data, error, meta }`.
- **Zod Validation**: Mọi Input/Output đều được ràng buộc bởi schema.
- **Decimal Conversion**: Tự động convert Prisma Decimal (Object) sang Number (float/int) tại JSON serialization layer.

---

**Philosophy**: _Code là tài liệu tốt nhất, nhưng design patterns là bản đồ để đọc code._
