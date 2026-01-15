# De-facto Codebase Rules (v2.0)

> Rules tự động trích xuất từ phân tích 50+ files thực tế.
> **Trạng thái:** BẮT BUỘC (MUST FOLLOW)

## 1. Naming Strategy

### Pattern: Files & Folders

- **Rule:** `kebab-case` cho mọi file và folder.
- **Evidence:** `d:\ecommerce\api\src\products\products.controller.ts`, `d:\ecommerce\api\src\auth\dto\login.dto.ts`
- **Exception:** Không tìm thấy.

### Pattern: Classes & Interfaces

- **Rule:** `PascalCase`. Class module/service có hậu tố rõ ràng.
- **Evidence:** `d:\ecommerce\api\src\auth\auth.service.ts`

```typescript
export class AuthService { ... } // Correct
export class AuthSvc { ... } // Incorrect
```

### Pattern: Variables & Functions

- **Rule:** `camelCase`. Boolean bắt đầu bằng `is`, `has`, `should`.
- **Evidence:** `d:\ecommerce\api\src\core\config\constants.ts`

```typescript
const isDevelopment = process.env.NODE_ENV === 'development';
```

### Pattern: Constants

- **Rule:** `UPPER_SNAKE_CASE` đi kèm `as const` object cho config.
- **Evidence:** `d:\ecommerce\api\src\core\config\constants.ts`

```typescript
export const RATE_LIMIT_CONFIG = {
  GLOBAL_LIMIT: 100,
} as const;
```

## 2. File & Folder Anatomy

### Bundle: Standard Feature Module

Mỗi module chuẩn trong `src/` bao gồm:

- `[name].module.ts`: Entry point, khai báo imports/exports.
- `[name].controller.ts`: API endpoints.
- `[name].service.ts`: Business logic.
- `[name].repository.ts`: Data access layer (Prisma queries).
- `dto/*.dto.ts`: Input validation.
- `[name].service.spec.ts`: Unit test (co-located).

**Evidence:** `src/catalog/products/`

```text
products/
├── dto/
│   ├── create-product.dto.ts
│   ├── update-product.dto.ts
│   └── filter-product.dto.ts
├── products.controller.ts
├── products.module.ts
├── products.service.ts
├── products.repository.ts    # ← Repository layer
└── products.service.spec.ts
```

### Pattern: Repository Layer

- **Purpose:** Tách biệt Prisma queries khỏi business logic.
- **Rule:** Mọi Prisma call nên đi qua Repository, không gọi trực tiếp trong Service.
- **Exception:** Simple CRUD trong modules nhỏ có thể gọi Prisma trực tiếp trong Service.
- **Evidence:** `src/catalog/products/products.repository.ts`, `src/cart/cart.repository.ts`

```typescript
// Repository (Data Access)
@Injectable()
export class ProductsRepository {
  constructor(private prisma: PrismaService) {}

  async findById(id: string) {
    return this.prisma.product.findUnique({ where: { id } });
  }
}

// Service (Business Logic) - inject Repository
@Injectable()
export class ProductsService {
  constructor(private readonly productsRepo: ProductsRepository) {}

  async getProduct(id: string) {
    const product = await this.productsRepo.findById(id);
    if (!product) throw new NotFoundException();
    return product;
  }
}
```

## 3. TypeScript & Type System

### Strictness

- **Rule:** Strict mode enabled. Hạn chế `any` trong Business Logic.
- **Exception:** Cho phép `any` trong **Core Infrastructure** (Interceptors, Middlewares) hoặc **Prisma Complex Writes** khi Typescript quá cứng nhắc.

### Type Definition

- **Rule:** Ưu tiên `interface` cho Object shape và DTO. Dùng `type` cho Union/Utility types.
- **Evidence:** `d:\ecommerce\api\src\core\interceptors\transform.interceptor.ts`

```typescript
export interface Response<T> {
  statusCode: number;
  message: string;
  data: T;
}
```

### Prisma Type Workarounds

Khi Prisma TypeScript quá strict với complex writes (nested creates, transactions), sử dụng pattern sau:

- **Pattern:** Wrap trong helper function với explicit return type.
- **Evidence:** `src/catalog/products/products.repository.ts`, `src/orders/orders.service.ts`

```typescript
// ❌ SAI - TypeScript không infer được nested type
const product = await this.prisma.product.create({
  data: complexNestedData as any, // Force any
});

// ✅ ĐÚNG - Định nghĩa type rõ ràng
type CreateProductInput = Prisma.ProductCreateInput;
const data: CreateProductInput = { ... };
const product = await this.prisma.product.create({ data });

// ✅ Alternative - Use satisfies operator
const data = { ... } satisfies Prisma.ProductCreateInput;
```

## 4. Import/Export Conventions

### Import Order

- **Observation:** External libs (`@nestjs/*`, `lodash`) -> Internal Alias (`@core/*`, `@/modules/*`) -> Relative imports (`./dto/..`).
- **Evidence:** `d:\ecommerce\api\src\main.ts`

```typescript
import { ValidationPipe } from '@nestjs/common'; // External
import { LoggerService } from '@core/logger/logger.service'; // Internal Alias
import { AppModule } from './app.module'; // Relative
```

### Export Style

- **Rule:** Named Export cho tất cả (Class, Const, Interface). Tránh Default Export.
- **Evidence:** `d:\ecommerce\api\src\core\config\constants.ts`

```typescript
export const AUTH_CONFIG = { ... } // Named export
// NO: export default AUTH_CONFIG
```

## 5. Error & Exception Handling

### Pattern

- **Logic:** Throw standard `HttpException` trong Service.
- **Catch:** Global Filter `AllExceptionsFilter` sẽ bắt và format lại.
- **Evidence:** `src/core/filters/all-exceptions.filter.ts`

```typescript
// Service layer
if (!user) throw new NotFoundException('User not found');

// Filter layer (Global)
response.status(status).json({
  statusCode: status,
  message: exception.message,
});
```

## 6. Git/Commit Standards

### Convention

- **Style:** Conventional Commits (có scope tùy chọn).
- **Format:** `<type>(<scope>): <subject>`
- **Types seen:** `feat`, `fix`, `chore`, `docs`, `refactor`.

**Evidence (Git Log):**

```text
feat(auth): implement jwt refresh token
fix(orders): calculate total amount precision
chore(deps): update nestjs packages
docs(readme): update setup instructions
```
