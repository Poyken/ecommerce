# Project Context - Ecommerce API

> **Last Updated**: 2026-01-23
> **Status**: Active Development

---

## 1. Current State

### Architecture

- **Pattern**: Clean Architecture (Domain → Application → Infrastructure → Presentation)
- **Framework**: NestJS 11 with TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Cache**: Redis (multi-layer caching)

### Domain Modules Status

| Module     | Clean Architecture | Status                                           |
| ---------- | ------------------ | ------------------------------------------------ |
| Catalog    | ✅ Refactored      | Domain/Application/Infrastructure layers created |
| Sales      | ✅ Refactored      | Domain layer created (Order, Cart aggregates)    |
| Identity   | ✅ Refactored      | Domain layer created (User aggregate)            |
| Marketing  | ⏳ Pending         | Not started                                      |
| Operations | ⏳ Pending         | Not started                                      |
| AI         | ⏳ Pending         | Not started                                      |

---

## 2. Key Patterns Implemented

### 2.1 Domain Layer

- **Entities**: `BaseEntity`, `AggregateRoot` with domain events
- **Value Objects**: `Money`, `Slug`, `Email` (immutable, self-validating)
- **Domain Errors**: `EntityNotFoundError`, `BusinessRuleViolationError`, etc.

### 2.2 Application Layer

- **Use Cases**: `CommandUseCase`, `QueryUseCase` base classes
- **Result Pattern**: `Result<T, E>` for functional error handling
- **Repository Interfaces**: Ports for data access abstraction

### 2.3 Infrastructure Layer

- **Mappers**: Entity ↔ Prisma model conversion
- **Repositories**: Prisma implementations of domain ports

---

## 3. Architectural Decisions Record (ADR)

### ADR-010: Clean Architecture Adoption

- **Date**: 2026-01-23
- **Decision**: Adopt Clean Architecture with 4 layers
- **Rationale**:
  - Better separation of concerns
  - Domain logic independent of framework
  - Easier testing and maintenance
- **Trade-offs**:
  - More boilerplate code
  - Learning curve for team
  - Need for mappers between layers

### ADR-011: Result Pattern for Error Handling

- **Date**: 2026-01-23
- **Decision**: Use Result<T, E> instead of throwing exceptions
- **Rationale**:
  - Explicit error handling
  - Type-safe error types
  - No hidden control flow
- **Trade-offs**:
  - More verbose code
  - Need to handle both success/failure cases

### ADR-012: Value Objects for Domain Concepts

- **Date**: 2026-01-23
- **Decision**: Use Value Objects for Money, Slug, Email, etc.
- **Rationale**:
  - Self-validation on creation
  - Immutability prevents bugs
  - Rich domain model
- **Trade-offs**:
  - Object creation overhead
  - Need for conversion when persisting

---

## 4. Changelog

### 2026-01-23 - Clean Architecture Refactoring

**Core Foundation:**

- Created `src/core/domain/entities/base.entity.ts` - BaseEntity, AggregateRoot, DomainEvent
- Created `src/core/domain/value-objects/` - Money, Slug, Email value objects
- Created `src/core/domain/errors/domain.error.ts` - Domain error hierarchy
- Created `src/core/application/use-case.interface.ts` - UseCase base classes
- Created `src/core/application/result.ts` - Result pattern for error handling
- Created `src/core/application/pagination.ts` - Pagination utilities

**Catalog Module:**

- Created `src/catalog/domain/entities/` - Product, SKU, Category, Brand
- Created `src/catalog/domain/repositories/` - Repository interfaces
- Created `src/catalog/application/use-cases/products/` - CRUD use cases
- Created `src/catalog/infrastructure/mappers/` - Prisma mappers

**Sales Module:**

- Created `src/sales/domain/entities/order.entity.ts` - Order aggregate with snapshots
- Created `src/sales/domain/entities/cart.entity.ts` - Cart aggregate
- Created `src/sales/domain/repositories/` - Order, Cart interfaces

**Identity Module:**

- Created `src/identity/domain/entities/user.entity.ts` - User aggregate
- Created `src/identity/domain/repositories/` - User interface

**Documentation:**

- Created `CONTEXT.md`, `clean-architecture.md` rules

---

## 5. Next Steps

1. Complete Catalog module refactor (connect use cases to controllers)
2. Refactor Sales module (Orders, Cart, Payment)
3. Refactor Identity module (Auth, Users, Roles)
4. Update Web frontend to match new patterns
5. Add integration tests for use cases

---

## 6. File Structure Reference

```
src/
├── core/
│   ├── domain/           # Base entities, value objects, domain errors
│   ├── application/      # Use case interfaces, result pattern, pagination
│   └── ...               # Existing infrastructure (prisma, redis, guards)
├── catalog/
│   ├── domain/           # Catalog entities and repository interfaces
│   │   ├── entities/
│   │   └── repositories/
│   ├── application/      # Catalog use cases
│   │   └── use-cases/
│   ├── infrastructure/   # Prisma repos, mappers
│   │   └── mappers/
│   └── presentation/     # Controllers (existing, to be refactored)
│       └── ...
└── [other modules]/      # Pending refactor
```
