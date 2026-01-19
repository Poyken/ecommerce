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

## 3. Server Actions & Security

- **Safe Actions**: Không gọi trực tiếp Server Actions. **PHẢI** dùng wrapper `next-safe-action` (`protectedActionClient`) để đảm bảo Auth & Validation (Zod).
- **No Sensitive Data**: Không truyền object DB raw (có password, internal ID) xuống Client.

## 4. Feature Management

- **Feature Flags**: Mọi tính năng mới hoặc không ổn định phải được bọc trong `useFeatureFlags()`.
- **Graceful Degradation**: UI phải có fallback nếu Feature Flag tắt.

## 3. Performance & Security

- **N+1 Prevention**: Luôn sử dụng `include` hoặc DataLoaders khi query liên kết trong Prisma.
- **Input Sanitization**: Không bao giờ tin tưởng input từ client.
- **Authentication**: Luôn kiểm tra quyền truy cập (RBAC) trước khi thực hiện logic nghiệp vụ.
