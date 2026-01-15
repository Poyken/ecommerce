# Type Definitions Guide

> Hướng dẫn định nghĩa và sử dụng types trong API codebase.
> **Trạng thái:** Tài liệu tham khảo

## 1. Type Locations

| Type Category         | Location                                     | Purpose                            |
| --------------------- | -------------------------------------------- | ---------------------------------- |
| **DTOs**              | `*/dto/*.dto.ts`                             | Input validation (class-validator) |
| **Response Types**    | `core/interceptors/transform.interceptor.ts` | API response wrapper               |
| **Prisma Types**      | Auto-generated                               | Database models                    |
| **Shared Interfaces** | `core/interfaces/`                           | Cross-module interfaces            |

## 2. DTO Pattern

DTOs sử dụng `class-validator` decorators để validate input:

```typescript
// src/catalog/products/dto/create-product.dto.ts
import { IsString, IsNotEmpty, IsArray, IsUUID } from 'class-validator';

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsArray()
  @IsUUID('all', { each: true })
  categoryIds: string[];

  @IsString()
  @IsOptional()
  description?: string;
}
```

## 3. Response Type Pattern

Tất cả API responses được wrap bởi `TransformInterceptor`:

```typescript
// Response structure
interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data: T;
  meta?: PaginationMeta; // For paginated responses
}

interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  lastPage: number;
}
```

## 4. Creating New Types

### Checklist khi tạo type mới:

1. **DTO cho input** → Tạo trong `[module]/dto/[action]-[entity].dto.ts`
2. **Validate với class-validator** → Thêm decorators phù hợp
3. **Document với Swagger** → Thêm `@ApiProperty()` decorators
4. **Sync với Frontend** → Update `web/types/dtos.ts` nếu public API

### Naming Convention:

| Purpose      | Pattern             | Example            |
| ------------ | ------------------- | ------------------ |
| Create Input | `Create[Entity]Dto` | `CreateProductDto` |
| Update Input | `Update[Entity]Dto` | `UpdateProductDto` |
| Filter/Query | `Filter[Entity]Dto` | `FilterProductDto` |
| Response     | `[Entity]Response`  | `ProductResponse`  |

## 5. Avoid `any` - Alternatives

| Situation       | Instead of `any` | Use                         |
| --------------- | ---------------- | --------------------------- |
| Unknown error   | `catch (e: any)` | `catch (e: unknown)`        |
| Prisma complex  | `data as any`    | `satisfies Prisma.XxxInput` |
| External API    | `any`            | Define interface from docs  |
| Generic handler | `any`            | Use generics `<T>`          |
