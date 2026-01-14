# API Architecture

## Overview

NestJS-based backend với Clean Architecture, Multi-tenancy, và Repository Pattern.

---

## Layer Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     CONTROLLERS                          │
│  HTTP handlers, request validation, response formatting │
└─────────────────────────┬───────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────┐
│                      SERVICES                            │
│  Business logic, orchestration, caching                 │
└─────────────────────────┬───────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────┐
│                    REPOSITORIES                          │
│  Data access, queries, tenant filtering                 │
└─────────────────────────┬───────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────┐
│                      PRISMA                              │
│  ORM, migrations, database schema                       │
└─────────────────────────────────────────────────────────┘
```

---

## Folder Structure

```
api/src/
├── core/                    # Shared infrastructure
│   ├── cache/               # Redis caching
│   ├── decorators/          # Custom decorators
│   ├── filters/             # Exception filters
│   ├── guards/              # Auth, Tenant guards
│   ├── interceptors/        # Response transform
│   ├── prisma/              # Database service
│   ├── redis/               # Redis service
│   ├── repository/          # Base repository
│   ├── tenant/              # Multi-tenancy
│   └── validation/          # Custom validators
│
├── auth/                    # Authentication module
├── catalog/                 # Products, Categories, Brands
│   ├── products/
│   ├── categories/
│   └── brands/
├── cart/                    # Shopping cart
├── orders/                  # Order management
├── payment/                 # Payment processing
├── users/                   # User management
└── ...other modules
```

---

## Multi-tenancy

### How it works:

```
Request → TenantMiddleware → AsyncLocalStorage → All Services
                ↓
          Extract tenant from:
          - X-Tenant-Domain header
          - subdomain
          - custom domain
```

### Usage in Services:

```typescript
// All repositories auto-filter by tenantId
export class ProductsRepository extends BaseRepository<Product> {
  async findBySlug(slug: string) {
    return this.model.findFirst({
      where: this.withTenantFilter({ slug }), // Auto adds tenantId
    });
  }
}
```

---

## Security

| Layer              | Implementation              |
| ------------------ | --------------------------- |
| **Authentication** | JWT + Refresh tokens        |
| **Authorization**  | RBAC with permissions       |
| **Validation**     | class-validator + whitelist |
| **Rate Limiting**  | @nestjs/throttler           |
| **CORS**           | Whitelist origins           |
| **Headers**        | Helmet (CSP, HSTS, XSS)     |

---

## Key Patterns

### 1. Repository Pattern

```typescript
// Controller → Service → Repository → Prisma
@Injectable()
export class ProductsService {
  constructor(private readonly repo: ProductsRepository) {}

  findAll(query) {
    return this.repo.findWithFilters(query);
  }
}
```

### 2. DTOs & Validation

```typescript
export class CreateProductDto {
  @IsString()
  @MinLength(3)
  name: string;

  @IsNumber()
  @Min(0)
  price: number;
}
```

### 3. Response Transform

```typescript
// All responses wrapped automatically:
{
  "success": true,
  "data": { ... },
  "message": "..."
}
```

---

## Database

- **ORM**: Prisma
- **DB**: PostgreSQL
- **Migrations**: `prisma/migrations/`
- **Indexes**: `prisma/sql/indexes/`

---

## Testing

```bash
npm run test          # Unit tests
npm run test:e2e      # E2E tests
npm run test:cov      # Coverage
```

---

## Monitoring

| Endpoint          | Purpose               |
| ----------------- | --------------------- |
| `/health`         | Liveness check        |
| `/health/ready`   | Readiness (DB, Redis) |
| `/health/metrics` | Prometheus metrics    |
