# Clean Architecture Guidelines

> Reference document for implementing Clean Architecture in this project.

---

## 1. Layer Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                        │
│            (Controllers, DTOs, Zod Schemas)                  │
├─────────────────────────────────────────────────────────────┤
│                    APPLICATION LAYER                         │
│              (Use Cases, Input/Output DTOs)                  │
├─────────────────────────────────────────────────────────────┤
│                      DOMAIN LAYER                            │
│    (Entities, Value Objects, Domain Events, Repo Interfaces)│
├─────────────────────────────────────────────────────────────┤
│                   INFRASTRUCTURE LAYER                       │
│         (Prisma Repos, Mappers, External Services)           │
└─────────────────────────────────────────────────────────────┘
          ↑ Dependencies only point INWARD ↑
```

---

## 2. Dependency Rule

**CRITICAL**: Dependencies must only point inward.

- ✅ Presentation → Application → Domain
- ✅ Infrastructure → Domain (implements interfaces)
- ❌ Domain → Application (NEVER)
- ❌ Domain → Infrastructure (NEVER)

---

## 3. Layer Responsibilities

### 3.1 Domain Layer (`domain/`)

- Pure business logic, NO framework dependencies
- Entities with identity (have ID)
- Value Objects (immutable, compared by value)
- Domain Events (things that happened)
- Repository Interfaces (ports)

**Example Files**:

```
domain/
├── entities/
│   ├── product.entity.ts      # Aggregate root
│   └── sku.entity.ts          # Entity within aggregate
├── value-objects/
│   ├── money.vo.ts
│   └── slug.vo.ts
├── repositories/
│   └── product.repository.interface.ts  # Port
└── errors/
    └── domain.error.ts
```

### 3.2 Application Layer (`application/`)

- Use cases (one per action)
- Orchestrates domain objects
- Transaction boundaries
- Input/Output DTOs

**Example Files**:

```
application/
├── use-cases/
│   └── products/
│       ├── create-product.use-case.ts
│       ├── get-product.use-case.ts
│       └── list-products.use-case.ts
└── dto/
    ├── create-product.dto.ts
    └── product-response.dto.ts
```

### 3.3 Infrastructure Layer (`infrastructure/`)

- Implements repository interfaces
- Database access (Prisma)
- External service integrations
- Mappers (Entity ↔ DB Model)

**Example Files**:

```
infrastructure/
├── repositories/
│   └── prisma-product.repository.ts  # Implements IProductRepository
├── mappers/
│   └── product.mapper.ts
└── services/
    └── product-cache.service.ts
```

### 3.4 Presentation Layer (`presentation/`)

- Controllers (HTTP endpoints)
- Zod validation schemas
- Request/Response transformation
- Error handling (map domain errors to HTTP)

**Example Files**:

```
presentation/
├── controllers/
│   └── products.controller.ts
└── schemas/
    ├── create-product.schema.ts
    └── update-product.schema.ts
```

---

## 4. Code Standards

### 4.1 Entities

```typescript
// ✅ GOOD: Entity with encapsulated business logic
export class Product extends AggregateRoot<ProductProps> {
  private constructor(props: ProductProps) {
    super(props);
  }

  // Factory method
  static create(props: CreateProductProps): Product {
    const product = new Product({...});
    product.addDomainEvent(new ProductCreatedEvent(...));
    return product;
  }

  // Business method
  updatePrice(newPrice: Money): void {
    if (newPrice.isLessThan(Money.zero())) {
      throw new BusinessRuleViolationError('Price cannot be negative');
    }
    this.props.price = newPrice;
    this.touch();
  }
}
```

### 4.2 Value Objects

```typescript
// ✅ GOOD: Immutable, self-validating
export class Email extends ValueObject<EmailProps> {
  static create(value: string): Email {
    if (!this.isValid(value)) {
      throw new ValidationError('email', 'Invalid format');
    }
    return new Email({ value: value.toLowerCase() });
  }
}
```

### 4.3 Use Cases

```typescript
// ✅ GOOD: Single responsibility, returns Result
@Injectable()
export class CreateProductUseCase extends CommandUseCase<Input, Output, Error> {
  async execute(input: Input): Promise<Result<Output, Error>> {
    // 1. Validate
    // 2. Create domain object
    // 3. Save via repository
    // 4. Return result
    return Result.ok({ product });
  }
}
```

### 4.4 Repository Interface (Port)

```typescript
// ✅ GOOD: In domain layer, framework-agnostic
export interface IProductRepository {
  findById(id: string): Promise<Product | null>;
  save(product: Product): Promise<Product>;
}

export const PRODUCT_REPOSITORY = Symbol('IProductRepository');
```

### 4.5 Repository Implementation (Adapter)

```typescript
// ✅ GOOD: In infrastructure layer, uses Prisma
@Injectable()
export class PrismaProductRepository implements IProductRepository {
  constructor(private prisma: PrismaService) {}

  async findById(id: string): Promise<Product | null> {
    const data = await this.prisma.product.findUnique({ where: { id } });
    return data ? ProductMapper.toDomain(data) : null;
  }
}
```

---

## 5. Module Structure

```
src/catalog/
├── catalog.module.ts           # NestJS module definition
├── domain/                     # Business logic (framework-free)
│   ├── entities/
│   ├── value-objects/
│   ├── repositories/           # Interfaces only
│   └── index.ts
├── application/                # Use cases
│   ├── use-cases/
│   └── index.ts
├── infrastructure/             # External concerns
│   ├── repositories/           # Prisma implementations
│   ├── mappers/
│   └── index.ts
└── presentation/               # HTTP layer
    ├── controllers/
    ├── schemas/
    └── index.ts
```

---

## 6. Testing Strategy

| Layer          | Test Type   | Tools                    |
| -------------- | ----------- | ------------------------ |
| Domain         | Unit        | Jest (no mocks needed)   |
| Application    | Unit        | Jest + Mock repositories |
| Infrastructure | Integration | Jest + Test DB           |
| Presentation   | E2E         | Supertest / Playwright   |

---

## 7. Common Mistakes to Avoid

1. ❌ Importing Prisma types in domain layer
2. ❌ Throwing exceptions instead of returning Result
3. ❌ Business logic in controllers
4. ❌ Direct DB access from use cases
5. ❌ Mutable entities (use methods to modify state)
6. ❌ Not using factory methods for entity creation
