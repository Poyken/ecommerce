---
trigger: always_on
description: Các quy chuẩn code Senior Fullstack (Zod-first, Clean Code, Performance).
---

# Senior Fullstack Rules

Bộ quy tắc này đảm bảo mọi đoạn code bạn viết đều đạt tiêu chuẩn Senior và dễ bảo trì cho solo developer.

## 1. Clean Code & Patterns

- **Early Return**: Luôn return ngay khi có lỗi hoặc điều kiện không thỏa mãn để giảm độ sâu của code.
- **Meaningful Names**: Biến, hàm, class phải mô tả đúng trách nhiệm. Tránh các tên chung chung như `data`, `handle`.
- **Dry vs Moist**: Không quá lạm dụng abstraction. Ưu tiên sự tường minh (Explicit) hơn là phép thuật ngầm.

## 2. API & Frontend Standard

- **Zod-First Persistence**: Luôn sử dụng Zod để validate dữ liệu từ request đến database.
- **Bất biến (Immutability)**: Ưu tiên sử dụng `const` và các phương thức không làm thay đổi dữ liệu gốc (map, filter, reduce).
- **Error Handling**: Luôn sử dụng `StandardResponse` (Success/Error) để Frontend dễ dàng xử lý.

## 3. Performance & Security

- **N+1 Prevention**: Luôn sử dụng `include` hoặc DataLoaders khi query liên kết trong Prisma.
- **Input Sanitization**: Không bao giờ tin tưởng input từ client.
- **Authentication**: Luôn kiểm tra quyền truy cập (RBAC) trước khi thực hiện logic nghiệp vụ.

## 4. Data Integrity & Snapshots

- **Historical Snapshots**: Đối với dữ liệu giao dịch (Orders, Invoices), **KHÔNG** reference trực tiếp đến Master Data (Product name, Price) vì nó có thể thay đổi. **PHẢI** lưu snapshot (copy) các trường quan trọng tại thời điểm tạo.
  - _Ví dụ_: `OrderItem` phải có `priceAtPurchase`, `skuNameSnapshot`, `shippingAddressSnapshot`.
- **Transactional Outbox**: Mọi tác vụ phụ (Side effects) như gửi Email, Noti, hay Sync dữ liệu bên thứ 3 PHẢI sử dụng `OutboxEvent` để đảm bảo tính nhất quán (Eventual Consistency).
- **Money Handling**: Luôn xử lý tiền tệ là số nguyên (Integer) hoặc dùng thư viện Decimal. Với VND, dùng `Math.round()` trước khi lưu DB.
