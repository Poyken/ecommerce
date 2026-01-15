# Type Synchronization Guide

> Hướng dẫn đồng bộ types giữa API và Web.
> **Source of Truth:** API types

## 1. Sync Strategy

```
API (Source)              Web (Consumer)
─────────────             ──────────────
api/src/*/dto/*.dto.ts → web/types/dtos.ts
Prisma Models           → web/types/models.ts
core/interceptors        → web/types/api.ts
```

## 2. Type Mapping

| API Location                                 | Web Location                      | Sync Method |
| -------------------------------------------- | --------------------------------- | ----------- |
| `catalog/products/dto/create-product.dto.ts` | `types/dtos.ts::CreateProductDto` | Manual      |
| `catalog/products/dto/update-product.dto.ts` | `types/dtos.ts::UpdateProductDto` | Manual      |
| `auth/dto/login.dto.ts`                      | `types/dtos.ts::LoginResponse`    | Manual      |
| Prisma `Product` model                       | `types/models.ts::Product`        | Manual      |
| `core/interceptors/transform.interceptor.ts` | `types/api.ts::ApiResponse`       | Manual      |

## 3. Sync Checklist

Khi API thay đổi DTO hoặc response structure:

- [ ] Identify changed fields in API DTO
- [ ] Update corresponding interface in `web/types/dtos.ts`
- [ ] Update `web/types/models.ts` if entity shape changed
- [ ] Run `npx tsc --noEmit` in web to verify no type errors
- [ ] Update this table with sync date

## 4. Last Sync Log

| Type               | API Source                 | Synced | Date       |
| ------------------ | -------------------------- | ------ | ---------- |
| `CreateProductDto` | `create-product.dto.ts`    | ✅     | 2026-01-15 |
| `Product`          | Prisma schema              | ✅     | 2026-01-15 |
| `ApiResponse`      | `transform.interceptor.ts` | ✅     | 2026-01-15 |

## 5. Common Discrepancies to Watch

| Field                         | API                     | Web                | Note                              |
| ----------------------------- | ----------------------- | ------------------ | --------------------------------- |
| `categoryId` vs `categoryIds` | `categoryIds: string[]` | Should match       | API uses array for multi-category |
| Decimal fields                | `Prisma.Decimal`        | `number \| string` | Web accepts both                  |
| Date fields                   | `Date`                  | `string`           | Serialized as ISO string          |

## 6. Adding New Types

1. Create DTO in API: `api/src/[module]/dto/[name].dto.ts`
2. Add interface to Web: `web/types/dtos.ts`
3. Add entry to sync table above
4. Document any differences in "Discrepancies" section
