# Quy Tắc Code Chung - Ecommerce Web

> ⚠️ Các quy tắc này được rút ra từ code hiện có, KHÔNG phải lý thuyết.

---

## 1. Naming Conventions

| Loại             | Pattern            | Evidence File                                    |
| ---------------- | ------------------ | ------------------------------------------------ |
| Folders          | kebab-case         | `features/super-admin/`, `components/shared/`    |
| Component Files  | kebab-case.tsx     | `product-card-base.tsx`, `wishlist-button.tsx`   |
| Component Names  | PascalCase         | `ProductCardBase`, `WishlistButton`              |
| Hooks            | use + camelCase    | `use-chat-socket.ts`, `use-admin-table.ts`       |
| Actions          | camelCase + Action | `loginAction`, `createReturnRequestAction`       |
| Types/Interfaces | PascalCase         | `ProductCardBaseProps`, `CartItem`               |
| Constants        | UPPER_SNAKE (hiếm) | Phần lớn dùng camelCase trong `lib/constants.ts` |

**Ví dụ code thực tế:**

```tsx
// Từ features/products/components/product-card-base.tsx
export interface ProductCardBaseProps {
  id: string;
  name: string;
  price: number;
  // ...
}

export function ProductCardBase({
  id,
  name,
  price,
}: // ...
ProductCardBaseProps) {
  // ...
}
```

---

## 2. File Organization

### Cấu trúc Feature Module

| Folder            | Mô tả                           | Evidence                                                |
| ----------------- | ------------------------------- | ------------------------------------------------------- |
| `components/`     | React components                | `features/products/components/` (22 files)              |
| `hooks/`          | Custom hooks                    | `features/cart/hooks/`                                  |
| `store/`          | Zustand stores                  | `features/cart/store/`, `features/notifications/store/` |
| `actions.ts`      | Server actions (single file)    | `features/auth/actions.ts`, `features/cart/actions.ts`  |
| `services/`       | API service classes             | `features/products/services/product.service.ts`         |
| `domain-actions/` | Domain-specific actions (admin) | `features/admin/domain-actions/` (12 files)             |
| `providers/`      | React context providers         | `features/cart/providers/`                              |

**Ví dụ cấu trúc thực tế:**

```
features/cart/
├── actions.ts           # Server actions
├── components/          # 7 component files
├── hooks/               # Custom hooks
├── providers/           # Context providers
└── store/               # Zustand store
```

### Vị trí Test Files

```
[KHÔNG TÌM THẤY - CẦN USER XÁC NHẬN]
- Không tìm thấy test files trong source code (*.test.ts, *.spec.ts)
- Chỉ có vitest.config.mts và vitest.setup.ts
```

---

## 3. TypeScript & Type System

### Type Strictness

| Pattern     | Count    | Verdict                           |
| ----------- | -------- | --------------------------------- |
| `: any`     | ~176 lần | ⚠️ Sử dụng nhiều, chưa strict     |
| `as any`    | ~173 lần | ⚠️ Type assertion bypass phổ biến |
| `: unknown` | ~36 lần  | ✅ Dùng cho error catching        |

**Evidence - `as any` cho routing (workaround Next.js i18n):**

```tsx
// features/products/components/product-card-base.tsx:84
router.prefetch(`/products/${id}` as any);

// features/layout/components/header-nav.tsx:73
href={link.href as any}
```

**Evidence - `unknown` cho error handling (best practice):**

```typescript
// features/auth/actions.ts:121
} catch (error: unknown) {
  return {
    error: (error as Error).message || "Failed to login",
  };
}
```

### Improvement Goals 🎯

| Category         | Current | Target     | Strategy                          |
| ---------------- | ------- | ---------- | --------------------------------- |
| `: any`          | ~176    | < 50       | Replace with proper interfaces    |
| `as any` routing | ~50+    | 0          | Use `TypedLink` wrapper component |
| API responses    | Varies  | 100% typed | Use `ApiResponse<T>` consistently |

**Priority Fixes:**

1. **Routing `as any`** → Create typed wrapper:

```tsx
// lib/typed-link.tsx
import { Link as NextIntlLink } from "@/i18n/routing";
import type { ComponentProps } from "react";

type TypedLinkProps = Omit<ComponentProps<typeof NextIntlLink>, "href"> & {
  href: `/${string}`;
};

export function TypedLink({ href, ...props }: TypedLinkProps) {
  return (
    <NextIntlLink
      href={href as Parameters<typeof NextIntlLink>[0]["href"]}
      {...props}
    />
  );
}
```

2. **API Response typing** → Always use wrapper:

```typescript
// ✅ ĐÚNG
const result = await http.get<ApiResponse<Product[]>>("/products");

// ❌ SAI
const result = await http.get("/products"); // Returns any
```

### Shared Types Location

All shared types MUST be imported from centralized locations:

| Type Category | Import From      | Example                             |
| ------------- | ---------------- | ----------------------------------- |
| Domain Models | `@/types/models` | `Product`, `User`, `Order`          |
| API DTOs      | `@/types/dtos`   | `CreateProductDto`, `LoginResponse` |
| API Utilities | `@/types/api`    | `ApiResponse<T>`, `PaginationMeta`  |

```typescript
// ✅ ĐÚNG - Import từ centralized types
import { Product, User } from "@/types/models";
import { ApiResponse } from "@/types/api";

// ❌ SAI - Định nghĩa local type trùng lặp
interface Product { ... } // Don't do this!
```

### Interface vs Type

| Loại        | Usage     | Evidence                                                             |
| ----------- | --------- | -------------------------------------------------------------------- |
| `interface` | ~410+ lần | `types/models.ts`, `types/dtos.ts` - Ưu tiên cho data models         |
| `type`      | ~33 lần   | Dùng cho unions, aliases (VD: `type FilterType = "all" \| "active"`) |
| `enum`      | 0 lần     | **KHÔNG DÙNG** - Dùng union types thay thế                           |

**Ví dụ code thực tế:**

```typescript
// types/models.ts - Dùng interface cho models
export interface Product {
  id: string;
  name: string;
  price: number;
  // ...
}

// app/[locale]/admin/.../products-client.tsx - Dùng type cho unions
type FilterType = "all" | "recent" | "no-category";
```

---

## 4. Import/Export Conventions

### Thứ tự Import

1. React/Next.js directives (`"use client"`, `"use server"`)
2. Feature-local imports (`@/features/...`)
3. Shared components (`@/components/...`)
4. i18n routing (`@/i18n/routing`)
5. Lib utilities (`@/lib/...`)
6. External packages (`next-intl`, `react`)

**Ví dụ code thực tế:**

```tsx
// features/products/components/product-card-base.tsx
"use client";

import { CompactRating } from "@/features/reviews/components/review-preview";
import { OptimizedImage } from "@/components/shared/optimized-image";
import { Link } from "@/i18n/routing";
import { m } from "@/lib/animations";
import { cn, formatCurrency } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { ReactNode, useCallback } from "react";
```

### Export Pattern

| Pattern                 | Usage      | Evidence                                     |
| ----------------------- | ---------- | -------------------------------------------- |
| Named export            | ✅ Chủ yếu | `export function ProductCardBase()`          |
| Default export          | ❌ Hiếm    | Chỉ dùng cho page components                 |
| Barrel files (index.ts) | ✅ Có      | `lib/index.ts`, `components/shared/index.ts` |

**Barrel export pattern:**

```typescript
// lib/index.ts
export * from "./utils";
export * from "./constants";
export * from "./types";
export * from "./schemas";

// components/shared/index.ts
export { OptimizedImage, ProductImage } from "./optimized-image";
export { DataTablePagination } from "./data-table-pagination";
// ...
```

---

## 5. Error & Exception Handling

### Pattern chính

| Pattern                    | Evidence                                           |
| -------------------------- | -------------------------------------------------- |
| `catch (error: unknown)`   | `features/auth/actions.ts:121, 150, 232, 269, 312` |
| `(error as Error).message` | Dùng kèm với unknown                               |
| `getErrorMessage(error)`   | Utility function trong `lib/error-utils.ts`        |

**Ví dụ code thực tế:**

```typescript
// lib/error-utils.ts
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  if (error && typeof error === "object") {
    if ("message" in error) {
      return String((error as { message: unknown }).message);
    }
  }
  return "Đã có lỗi xảy ra, vui lòng thử lại sau";
}
```

### Logging

```
[KHÔNG TÌM THẤY PATTERN RÕ RÀNG]
- Không thấy logging library (winston, pino)
- Có thể dùng console.log/console.error trực tiếp
```

---

## 6. Git/Commit Standards

| Pattern                | Evidence              |
| ---------------------- | --------------------- |
| Conventional Commits   | ❌ Không nhất quán    |
| Prefix `feat:`, `fix:` | ⚠️ Có nhưng không đều |

**10 commits gần nhất:**

```
4122e46 feat: Implement the core e-commerce API...
8e811e8 feat: update code
e85b554 update doc
8f5a875 update code
fd09d32 update code
b8cf132 update code
ac38a0e update code
43fe003 update code
6437599 update code
876e064 update code
```

**Verdict**: Commit messages chưa có chuẩn rõ ràng. Phần lớn là "update code".

---

## 7. Component Documentation Pattern

Dự án có pattern viết JSDoc comment giải thích cho "Thực tập sinh":

```typescript
// features/products/components/product-card-base.tsx
/**
 * =====================================================================
 * PRODUCT CARD BASE - Card sản phẩm dùng chung
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. PREDICTIVE PREFETCHING:
 * - `onMouseEnter`: Khi user hover vào card, ta đoán 80% user sẽ click.
 * - Gọi `router.prefetch()` để tải trước trang chi tiết.
 *
 * 2. SLOT PATTERN (Render Props):
 * - Prop `actions` nhận vào ReactNode (nút Wishlist, QuickView...).
 * ...
 */
```

---

## Tóm tắt Những Điểm Cần Cải thiện

| Vấn đề               | Mức độ        | Khuyến nghị                  |
| -------------------- | ------------- | ---------------------------- |
| Quá nhiều `any`      | 🔴 Cao        | Định nghĩa proper types      |
| `as any` cho routing | 🟡 Trung bình | Tạo typed Link wrapper       |
| Không có test files  | 🔴 Cao        | Thêm unit tests              |
| Commit messages      | 🟡 Trung bình | Áp dụng Conventional Commits |
