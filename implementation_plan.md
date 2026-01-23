# Implementation Plan: Clean Architecture Refactoring

> **Status**: ✅ IN PROGRESS (Batches 1-4 COMPLETED, Batch 5-6 PARTIAL)
> **Created**: 2026-01-23
> **Last Updated**: 2026-01-23 22:36
> **Scope**: API (NestJS) + Web (Next.js) Clean Architecture Restructure

---

## 📋 Executive Summary

Refactor toàn bộ codebase theo **Clean Architecture** (Uncle Bob) với các tiêu chuẩn:

- **Separation of Concerns**: Tách rõ 4 layers (Domain → Application → Infrastructure → Presentation)
- **Dependency Rule**: Dependencies chỉ hướng vào trong (Presentation → Application → Domain)
- **Framework Independence**: Domain layer không phụ thuộc NestJS/Next.js

---

## 🏗️ Phase 1: API Foundation (NestJS) - Priority HIGH

### 1.1 Core Infrastructure Cleanup

**Files affected**: `src/core/`

| Action   | Target                                | Description                                 |
| -------- | ------------------------------------- | ------------------------------------------- |
| CREATE   | `src/core/domain/`                    | Base entities, value objects, domain errors |
| CREATE   | `src/core/application/`               | Base use case interface, result pattern     |
| REFACTOR | `src/core/repository/`                | Abstract repository interfaces              |
| KEEP     | `src/core/prisma/`, `src/core/redis/` | Infrastructure stays                        |

**New Structure**:

```
src/core/
├── domain/
│   ├── entities/
│   │   └── base.entity.ts        # BaseEntity with id, createdAt, updatedAt
│   ├── value-objects/
│   │   ├── money.vo.ts           # Money value object (VND integer)
│   │   └── slug.vo.ts            # Slug value object
│   └── errors/
│       └── domain.error.ts       # DomainError base class
├── application/
│   ├── use-case.interface.ts     # IUseCase<TInput, TOutput>
│   ├── result.ts                 # Result<T, E> pattern
│   └── pagination.ts             # PaginatedResult<T>
├── infrastructure/               # Keep existing (prisma, redis, etc.)
└── presentation/                 # Keep existing (guards, interceptors, etc.)
```

### 1.2 Catalog Module Refactoring (Template Module)

**Files affected**: `src/catalog/` (~36 files)

**Current Structure**:

```
src/catalog/
├── brands/
│   ├── brands.controller.ts
│   ├── brands.service.ts
│   └── dto/
├── categories/
├── products/
└── skus/
```

**New Structure (Clean Architecture)**:

```
src/catalog/
├── catalog.module.ts             # Module definition
├── domain/
│   ├── entities/
│   │   ├── product.entity.ts     # Product aggregate root
│   │   ├── sku.entity.ts         # SKU entity
│   │   ├── category.entity.ts
│   │   └── brand.entity.ts
│   ├── value-objects/
│   │   ├── product-name.vo.ts
│   │   ├── sku-code.vo.ts
│   │   └── price.vo.ts
│   ├── repositories/             # Interfaces only (Ports)
│   │   ├── product.repository.interface.ts
│   │   ├── category.repository.interface.ts
│   │   └── brand.repository.interface.ts
│   └── services/                 # Domain services
│       └── pricing.domain-service.ts
├── application/
│   ├── use-cases/
│   │   ├── products/
│   │   │   ├── create-product.use-case.ts
│   │   │   ├── update-product.use-case.ts
│   │   │   ├── get-product.use-case.ts
│   │   │   └── list-products.use-case.ts
│   │   ├── categories/
│   │   └── brands/
│   └── dto/                      # Application DTOs (Input/Output)
│       ├── create-product.dto.ts
│       └── product-response.dto.ts
├── infrastructure/
│   ├── repositories/             # Implementations (Adapters)
│   │   ├── prisma-product.repository.ts
│   │   ├── prisma-category.repository.ts
│   │   └── prisma-brand.repository.ts
│   ├── mappers/                  # Entity <-> Prisma Model
│   │   └── product.mapper.ts
│   └── cache/
│       └── product-cache.service.ts
└── presentation/
    ├── controllers/
    │   ├── products.controller.ts
    │   ├── categories.controller.ts
    │   └── brands.controller.ts
    └── schemas/                  # Zod validation schemas
        ├── create-product.schema.ts
        └── update-product.schema.ts
```

### 1.3 Sales Module Refactoring

**Files affected**: `src/sales/` (~38 files)

Same pattern as Catalog but with additional complexity:

- **Aggregate Roots**: Order, Cart
- **Domain Events**: OrderPlaced, OrderShipped, PaymentReceived
- **Snapshots**: Price/SKU snapshots at order time (per coding-standards.md)

### 1.4 Identity Module Refactoring

**Files affected**: `src/identity/` (~54 files)

Focus on:

- User aggregate with authentication logic
- Role/Permission value objects
- Session management in domain layer

---

## 🖥️ Phase 2: Web Foundation (Next.js) - Priority MEDIUM

### 2.1 Feature Module Standard Structure

**Template Structure** (áp dụng cho mỗi feature):

```
features/<feature-name>/
├── components/           # UI components (React)
│   ├── <feature>-list.tsx
│   ├── <feature>-card.tsx
│   └── <feature>-form.tsx
├── hooks/                # Custom hooks (data fetching, state)
│   ├── use-<feature>.ts
│   └── use-<feature>-mutation.ts
├── actions/              # Server Actions (next-safe-action)
│   ├── get-<feature>.action.ts
│   └── create-<feature>.action.ts
├── schemas/              # Zod validation schemas
│   ├── <feature>.schema.ts
│   └── <feature>-form.schema.ts
├── types/                # TypeScript types (derived from schemas)
│   └── <feature>.types.ts
├── utils/                # Feature-specific utilities
│   └── <feature>-helpers.ts
└── index.ts              # Public exports
```

### 2.2 Shared Library Restructure

**Current**: `lib/` has mixed concerns

**New Structure**:

```
lib/
├── core/                 # Framework-agnostic core
│   ├── result.ts         # Result<T, E> pattern (shared with API)
│   └── pagination.ts     # Pagination types
├── api/                  # API client
│   ├── http.ts           # Fetch wrapper (existing)
│   └── endpoints.ts      # API endpoint constants
├── auth/                 # Authentication
│   ├── session.ts        # Session management (existing)
│   └── guards.ts         # Client-side auth guards
├── hooks/                # Global hooks
│   └── use-media-query.ts
├── utils/                # Pure utility functions
│   ├── format.ts         # formatCurrency, formatDate
│   └── cn.ts             # className merger
└── schemas/              # Shared Zod schemas
    └── common.schema.ts  # Email, Phone, etc.
```

### 2.3 Apply to Core Features

Priority order:

1. `features/auth/` - Login, Register, Session
2. `features/products/` - Product listing, detail
3. `features/cart/` - Cart management
4. `features/checkout/` - Checkout flow
5. `features/admin/` - Admin dashboard

---

## 📚 Phase 3: Documentation Update

### 3.1 API `.agent/` Updates

| File                          | Action | Description                    |
| ----------------------------- | ------ | ------------------------------ |
| `knowledge/CONTEXT.md`        | CREATE | Changelog + current state      |
| `knowledge/architecture.md`   | UPDATE | Add Clean Architecture details |
| `knowledge/modules-map.md`    | UPDATE | Reflect new structure          |
| `rules/clean-architecture.md` | CREATE | Clean Architecture guidelines  |

### 3.2 Web `.agent/` Updates

| File                             | Action | Description                |
| -------------------------------- | ------ | -------------------------- |
| `knowledge/CONTEXT.md`           | CREATE | Changelog + current state  |
| `knowledge/architecture.md`      | CREATE | Frontend architecture      |
| `knowledge/feature-structure.md` | CREATE | Feature module standard    |
| `rules/component-standards.md`   | CREATE | React component guidelines |

---

## ✅ Implementation Checklist

### Batch 1: Core Foundation ✅ COMPLETED

- [x] Create `src/core/domain/` with base entities and value objects
- [x] Create `src/core/application/` with use case interfaces
- [x] Create Result pattern implementation
- [x] Verify build passes

### Batch 2: Catalog Module ✅ COMPLETED

- [x] Create new folder structure
- [x] Create Product aggregate root (domain/entities)
- [x] Create Category, Brand, SKU entities
- [x] Create repository interfaces (domain/repositories)
- [x] Create Product use cases (application/use-cases)
- [x] Create mappers (infrastructure/mappers)
- [ ] Wire up to controllers (pending)

### Batch 3: Sales Module ✅ COMPLETED (Domain Layer)

- [x] Create Order aggregate with snapshots and events
- [x] Create Cart aggregate
- [x] Create repository interfaces
- [ ] Create use cases (pending)
- [ ] Wire up to controllers (pending)

### Batch 4: Identity Module ✅ COMPLETED (Domain Layer)

- [x] Create User aggregate with auth logic
- [x] Create repository interface
- [ ] Create use cases (pending)
- [ ] Wire up to controllers (pending)

### Batch 5: Web Documentation ✅ COMPLETED

- [x] Create CONTEXT.md
- [x] Create feature-structure.md
- [x] Create/Update architecture.md
- [ ] Restructure actual features (pending)

### Batch 6: API Documentation ✅ COMPLETED

- [x] Create CONTEXT.md
- [x] Create clean-architecture.md rules
- [x] Update implementation status

---

## ⚠️ Risk Mitigation

1. **Breaking Changes**: Each batch ends with `npm run build` + `npm run lint`
2. **Rollback Strategy**: Git commit after each successful batch
3. **Import Path Changes**: Use VSCode "Update imports on file move" + manual verification

---

## 🎯 Success Criteria

- [ ] All builds pass (`npm run build` for both API and Web)
- [ ] All lints pass (`npm run lint` for both API and Web)
- [ ] Clean Architecture layers are clearly separated
- [ ] `.agent/` documentation reflects new structure
- [ ] No breaking changes to API contracts (same endpoints, same responses)

---

**🔔 APPROVAL REQUIRED**: Please review this plan and confirm with "Turbo OK" to proceed with autonomous execution, or provide specific feedback.
