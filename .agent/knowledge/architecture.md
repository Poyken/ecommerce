# Architecture Reference

Tài liệu này mô tả kiến trúc hệ thống và các quyết định thiết kế.

---

## 1. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         CLIENTS                              │
│              (Web Browser, Mobile App)                       │
└─────────────────────┬───────────────────────────────────────┘
                      │
          ┌───────────▼───────────┐
          │       Next.js         │  ← Server Components + Server Actions
          │    (Port 3000)        │
          └───────────┬───────────┘
                      │
          ┌───────────▼───────────┐
          │       NestJS          │  ← REST API + WebSocket
          │    (Port 8080 x2)     │     (2 replicas for HA)
          └───────────┬───────────┘
                      │
     ┌────────────────┼────────────────┐
     │                │                │
┌────▼────┐    ┌──────▼──────┐   ┌─────▼─────┐
│ Postgres │    │    Redis    │   │  BullMQ   │
│ (pgvector)│    │   (Cache)   │   │  (Queue)  │
└──────────┘    └─────────────┘   └───────────┘
```

---

## 2. Module Structure (API)

```
api/src/
├── core/                 # Infrastructure Layer
│   ├── config/           # App configuration
│   ├── prisma/           # Database module
│   ├── redis/            # Cache module
│   ├── guards/           # Auth guards (JWT, RBAC, Throttle)
│   ├── interceptors/     # Logging, Audit, Idempotency
│   ├── filters/          # Exception handling
│   ├── decorators/       # Custom decorators
│   ├── events/           # Domain Events
│   └── repository/       # Base Repository
│
├── auth/                 # Authentication module
├── users/                # User management
├── tenants/              # Multi-tenancy
├── roles/                # RBAC
│
├── catalog/              # Product domain (SHOULD be consolidated)
│   ├── categories/
│   ├── brands/
│   ├── products/
│   └── skus/
│
├── cart/                 # Shopping cart
├── orders/               # Order processing
├── payment/              # Payment integration
├── shipping/             # Logistics (GHN, GHTK)
├── inventory/            # Stock management
│
├── promotions/           # Discount engine
├── return-requests/      # RMA
├── loyalty/              # Points system
│
├── ai/                   # AI features
│   ├── ai-chat/
│   ├── agent/
│   ├── insights/
│   ├── rag/
│   └── images/
│
├── blog/                 # CMS
├── pages/
├── reviews/
├── notifications/
│
└── worker/               # Background jobs
```

---

## 3. Architectural Decisions (ADR)

### ADR-001: Multi-tenant Shared Database

- **Quyết định**: Sử dụng Shared Database với `tenantId` trên mọi table.
- **Lý do**: Đơn giản hóa deployment, giảm chi phí cho SME.
- **Trade-off**: Cần cẩn thận với data isolation khi query.

### ADR-002: Prisma as Single ORM

- **Quyết định**: Chỉ dùng Prisma, không mix với TypeORM hoặc Knex.
- **Lý do**: Type-safety tuyệt đối, migration dễ quản lý.
- **Trade-off**: Một số advanced queries cần raw SQL.

### ADR-003: Domain Events via EventEmitter

- **Quyết định**: Sử dụng `@nestjs/event-emitter` cho Domain Events.
- **Lý do**: Đủ cho scale hiện tại, dễ migrate sang Kafka/RabbitMQ sau.
- **Trade-off**: Không persistent, cần Transactional Outbox cho reliability.

### ADR-004: Transactional Outbox Pattern

- **Quyết định**: Sử dụng `OutboxEvent` table cho event reliability.
- **Lý do**: Đảm bảo events không bị mất khi service crash.

### ADR-005: Server Actions for Mutations

- **Quyết định**: Ưu tiên Next.js Server Actions thay vì REST calls.
- **Lý do**: Type-safety end-to-end, giảm boilerplate.
- **Trade-off**: Không phù hợp cho mobile apps.

### ADR-006: Soft Delete cho mọi Entity quan trọng

- **Quyết định**: User, Product, Order, Tenant có `deletedAt`.
- **Lý do**: Audit trail, khả năng recovery, GDPR compliance.

### ADR-007: API Horizontal Scaling

- **Quyết định**: Docker Compose với `replicas: 2` cho API.
- **Lý do**: High availability, zero-downtime deployment.
- **Yêu cầu**: Redis cho session/cache sharing.

---

## 4. Security Measures

| Layer         | Protection                                                     |
| ------------- | -------------------------------------------------------------- |
| Network       | Rate Limiting (Throttler), CORS, Helmet                        |
| Auth          | JWT (Access + Refresh), 2FA (TOTP), Social Login               |
| Authorization | RBAC (Role + Permission), Tenant Isolation                     |
| Data          | Input Validation (Zod), SQL Injection (Prisma), XSS (Sanitize) |
| API           | CSRF Protection, Idempotency Keys                              |
| Monitoring    | Sentry, Audit Logs                                             |

---

## 5. Performance Optimizations

| Area     | Technique                                         |
| -------- | ------------------------------------------------- |
| Database | Indexes, Partial indexes, Connection pooling      |
| Queries  | DataLoader (N+1 prevention), Include optimization |
| Caching  | Redis (Session, Throttle, Hot data)               |
| Assets   | Cloudinary CDN, Image optimization (Sharp)        |
| Frontend | React 19, Server Components, Streaming            |
