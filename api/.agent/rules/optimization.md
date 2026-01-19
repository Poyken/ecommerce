---
trigger: always_on
description: Các quy tắc tối ưu hóa cho dự án (Zod-Only, Module consolidation, Shared package).
---

# Optimization Rules (Tối ưu hóa)

Các quy tắc này khắc phục những vấn đề đã phát hiện trong dự án hiện tại.

---

## 1. Validation: Zod-Only Policy

**Vấn đề**: Mix nhiều thư viện (Joi, Zod, class-validator).
**Giải pháp**: Chỉ sử dụng **Zod** cho mọi validation.

```typescript
// ❌ KHÔNG LÀM
import * as Joi from 'joi';
import { IsString } from 'class-validator';

// ✅ LÀM ĐÚNG
import { z } from 'zod';
export const CreateUserSchema = z.object({ ... });
```

---

## 2. Module Consolidation

**Vấn đề**: Quá nhiều module nhỏ (35+), khó quản lý.
**Giải pháp**: Gộp các module liên quan thành Feature Modules.

| Trước (Tách lẻ)                            | Sau (Gộp) |
| ------------------------------------------ | --------- |
| `categories`, `brands`, `products`, `skus` | `catalog` |
| `orders`, `order-items`, `payments`        | `orders`  |
| `ai-chat`, `agent`, `insights`, `rag`      | `ai`      |

---

## 3. Advanced Patterns (Adhere to these)

- **Manual Batching**: Use `where: { id: { in: ids } }` instead of loops for DB queries. (See `OrdersService`, `ProductsService`).
- **Smart Data Migration**: When updating complex entities (like Product with SKUs), capture snapshot before update to minimize destructive changes. (See `ProductsService.update`).
- **Dynamic Imports**: Use `await import('lib')` for heavy libraries used infrequently (e.g., AI/Image processing).
- **Denormalization**: Cache computed values (avgRating, minPrice) in the main table to avoid expensive aggregations during read.

---

## 5. Caching Strategy (Multi-layer)

- **L1 In-Memory**: Use `cache-manager` for high-frequency, low-consistency data (e.g., Filtering Lists). TTL: ~60s.
- **L2 Redis**: Use `RedisService` for shared object caching (e.g., Product Details, Sessions). TTL: ~5m+.
- **Canonicalization**: Always sort query parameters (keys) before creating cache keys to maximize Cache Hit Rate. (See `ProductsService.findAll`).

**Vấn đề**: AI modules triển khai sớm khi Core chưa ổn.
**Giải pháp**: Ưu tiên theo thứ tự:

1. Auth + Users
2. Catalog (Product/SKU)
3. Cart + Orders + Payment
4. Inventory
5. _(Sau khi có đơn hàng đầu tiên)_ → AI, Loyalty, Analytics

---

## 5. Test Coverage cho Critical Paths

**Vấn đề**: Thiếu Integration Tests.
**Giải pháp**: Yêu cầu E2E tests cho:

- [ ] Auth Flow (Login, Register, Refresh Token)
- [ ] Checkout Flow (Add to Cart → Place Order → Payment)
- [ ] Admin CRUD (Create Product, Update Inventory)
