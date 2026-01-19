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

## 3. Shared Package First

**Vấn đề**: Không có shared types giữa API và Web.
**Giải pháp**: Tạo `packages/shared` với Zod schemas.

```
packages/
  shared/
    src/
      schemas/
        user.schema.ts
        product.schema.ts
        order.schema.ts
      constants/
        order-status.ts
      index.ts
```

---

## 4. Core Before Features

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
