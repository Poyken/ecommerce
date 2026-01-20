# API Documentation

This document provides a high-level overview of the API modules available in the system.

## Domain Overview

The API is structured around **Domain-Driven Design (DDD)** principles, grouped into major functional areas.

### 1. Catalog Domain

Managed by `CatalogModule`.

- **Products**: CRUD, filtering, search (Full-text & Vector).
- **SKUs**: Variant management, pricing.
- **Categories**: Nested category tree.
- **Brands**: Brand management.

### 2. Sales Domain

Managed by `SalesModule`.

- **Cart**: Persistent cart, item management.
- **Orders**: Order placement, status transitions, history.
- **Payment**: Payment processing, webooks.
- **Shipping**: Shipping fee calculation, tracking.

### 3. Identity & Access

- **Auth**: JWT-based auth, MFA, Social Login.
- **RBAC**: Granular permission checks (`@RequirePermissions`).
- **Tenancy**: Data isolation via `tenantId`.

### 4. Inventory Domain

- **Warehouses**: Multi-warehouse management.
- **Stock**: Real-time stock tracking via `InventoryItem`.
- **Logs**: Audit trail of all stock movements.

### 5. Marketing Domain

- **Promotions**: Flexible rule-based promotion engine.
- **Loyalty**: Point earning and redemption rules.

### 6. AI Domain

- **Chatbot**: RAG-based assistant for product discovery.
- **Embeddings**: Product data vectorization for semantic search.

---

## API Standards

### Request & Multi-tenancy

- **JSON Body**: All mutations (POST/PUT/PATCH) expect JSON.
- **Validation**: Strict validation via **Zod** (`nestjs-zod`).
- **Tenant Context**: Managed via `x-tenant-id` header or inferred from the Hostname.

### Response Format (Unified)

All successful API responses are standardized via `TransformInterceptor`:

```json
{
  "statusCode": 200,
  "message": "Operation successful",
  "data": { ... }, // Payload (Prisma Decimals converted to Numbers)
  "meta": {
    "total": 100,
    "page": 1,
    "limit": 10,
    "lastPage": 10
  }
}
```

### Error Handling

Consistent error structure provided by `AllExceptionsFilter`:

```json
{
  "success": false,
  "error": {
    "statusCode": 404,
    "message": "Product with ID 123 not found",
    "code": "NotFoundException",
    "timestamp": "2026-01-20T...",
    "path": "/api/products/123"
  }
}
```

### Search & Filtering

- **Full-text Search**: Query param `search` triggers Prisma PostgreSQL FTS.
- **Pagination**: Offset-based (`page`, `limit`).
- **Contextual Filters**: Support for `tenantId`, `status`, `category`, etc.

---

## Technical Implementation Patterns

### 1. Atomic Concurrency Control

To prevent overselling, stock updates use Atomic increments/decrements in the DB:
`UPDATE Sku SET stock = stock - N WHERE id = X AND stock >= N`.

### 2. Transactional Outbox

Ensures data consistency between Database and Message Broker (BullMQ). Events like `ORDER_CREATED` are stored in the `OutboxEvent` table within the same transaction as the Business Logic.

### 3. Background Processing (BullMQ)

Offloads non-blocking tasks to Redis:

- `email-queue`: Transactional emails.
- `orders-queue`: Status expiration, loyalty point processing.
- `analytics-queue`: Behavior tracking.

---

## Key Workflows

### 1. Checkout Journey

1. **Cart Validation**: Check active status and stock.
2. **Stock Reservation**: Atomic lock on SKUs.
3. **Promotion Application**: Rule-based discount calculation.
4. **Order Persistance**: Snapshot creation + Outbox event registration.

### 2. AI Recommendation (RAG)

1. **Retrieval**: Search catalog using query keywords.
2. **Contextualization**: Inject product details into the LLM prompt.
3. **Response**: Natural language advice with actionable QuickView links.
