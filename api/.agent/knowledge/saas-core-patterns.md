# SaaS Core Design Patterns

> **Purpose**: Deep dive into the "Secret Sauce" of the e-commerce platform.  
> **Target**: Senior Fullstack Engineers

---

## 1. Multi-Tenancy Isolation

Hệ thống sử dụng mô hình **Shared Database** với cơ chế cô lập dữ liệu tại tầng Application.

### 1.1 Tenant Resolution Engine

Resolution diễn ra sớm nhất có thể trong request lifecycle:

1. **Middleware**: Trích xuất Host (hoặc `x-tenant-id`) -> Lookup Tenant ID trong Redis/DB.
2. **Context Persistence**: Sử dụng `nestjs-cls` (AsyncLocalStorage) để lưu `tenantId`.
3. **Implicit Filtering**: Mọi query Prisma được tự động filter:
   ```typescript
   // Automated via Global Interceptor/Guard or Service Helper
   where: {
     tenantId: this.cls.get('tenantId');
   }
   ```

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

Sử dụng **Compare-and-Swap (CAS)** hoặc **Negative Stock Prevention**:

```sql
UPDATE "Sku"
SET "stock" = "stock" - :qty,
    "reservedStock" = "reservedStock" + :qty
WHERE "id" = :id AND "stock" >= :qty
```

Nếu `affectedRows === 0`, chúng ta ném lỗi `InsufficientStockException`. Điều này an toàn hơn nhiều so với việc kiểm tra stock bằng code rồi mới update (Race condition).

---

## 4. Historical Snapshots

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
