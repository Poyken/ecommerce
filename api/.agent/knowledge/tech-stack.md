# Tech Stack Reference

Tài liệu này chứa toàn bộ thông tin về Tech Stack, dependencies và cách sử dụng.

---

## 1. Backend (NestJS 11)

### Core Dependencies

| Package                 | Version | Mục đích                                                               |
| ----------------------- | ------- | ---------------------------------------------------------------------- |
| `@nestjs/core`          | 11.x    | Framework chính                                                        |
| `@nestjs/config`        | 4.x     | Environment variables                                                  |
| `@nestjs/jwt`           | 11.x    | JWT Authentication                                                     |
| `@nestjs/passport`      | 11.x    | Auth strategies (Google, Facebook)                                     |
| `@nestjs/swagger`       | 11.x    | API Documentation                                                      |
| `@nestjs/throttler`     | 6.x     | Rate Limiting                                                          |
| `@nestjs/bullmq`        | 11.x    | Job Queue                                                              |
| `@nestjs/schedule`      | 6.x     | Cron Jobs                                                              |
| `@nestjs/websockets`    | 11.x    | Real-time                                                              |
| `@nestjs/cache-manager` | 3.x     | Caching                                                                |
| `nestjs-zod`            | 5.1.x   | Zod Integration for NestJS                                             |
| `nestjs-cls`            | 6.x     | Tenant Context Storage                                                 |
| `nestjs-i18n`           | 10.x    | Backend Internationalization (Missing in package.json but recommended) |

### Database & ORM

| Package          | Version | Mục đích        |
| ---------------- | ------- | --------------- |
| `prisma`         | 6.19.0  | ORM CLI         |
| `@prisma/client` | 6.2.1   | Database Client |
| `ioredis`        | 5.8.2   | Redis Client    |

### Validation (Zod-First Standard)

| Package           | Status     | Khuyến nghị                 |
| ----------------- | ---------- | --------------------------- |
| `joi`             | ❌ REMOVED | Đã loại bỏ hoàn toàn        |
| `class-validator` | ❌ REMOVED | Đã loại bỏ hoàn toàn        |
| `zod`             | ^4.3.5     | ✅ Chuẩn duy nhất API + Web |
| `nestjs-zod`      | 5.1.1      | ✅ Validation Pipe          |

### Utilities

| Package      | Version | Mục đích                   |
| ------------ | ------- | -------------------------- |
| `bcrypt`     | 6.x     | Password hashing (Active)  |
| `argon2`     | -       | Password hashing (Planned) |
| `nodemailer` | 7.x     | Email sending              |
| `otplib`     | 12.x    | 2FA OTP generation         |
| `cloudinary` | 2.8.x   | Image upload               |
| `sharp`      | 0.34.x  | Image processing           |
| `slugify`    | 1.6.x   | URL slug generation        |
| `exceljs`    | 4.4.x   | Excel export               |
| `winston`    | 3.19.x  | Logging                    |

### AI

| Package                 | Version | Mục đích          |
| ----------------------- | ------- | ----------------- |
| `@google/generative-ai` | 0.24.1  | Google Gemini API |

### Monitoring & Observability

| Package                       | Version | Mục đích                         | Status     |
| ----------------------------- | ------- | -------------------------------- | ---------- |
| `@sentry/nestjs`              | 10.x    | Error tracking                   | ✅ Active  |
| `@willsoto/nestjs-prometheus` | 6.x     | Prometheus Metrics (Supastarter) | 📅 Planned |
| `@bull-board/api`             | 6.x     | Job Queue Dashboard              | 📅 Planned |

---

## 2. Core Comparison (Supastarter vs Current)

| Feature           | Supastarter               | Current Project               | Action                 |
| ----------------- | ------------------------- | ----------------------------- | ---------------------- |
| **Multi-tenancy** | Isolated (Custom Domains) | Shared DB (AsyncLocalStorage) | Adopt Custom Domains   |
| **Auth**          | Better-auth               | JWT + Passport                | Migrate to Better-auth |
| **Monitoring**    | Prometheus + Grafana      | Sentry                        | Add Prometheus         |
| **E2E Testing**   | Playwright (High)         | Playwright (Medium)           | Increase coverage      |
| **DX**            | Excellent (Templates)     | Strong (Architecture)         | Add more infra docs    |

---

## 3. Performance Benchmarks (Targets)

- **API Latency**: <50ms (Core endpoints)
- **DB Query**: <10ms (Indexed queries)
- **Cache Hit Rate**: >90% (Redis)
- **Worker Throughput**: >100 jobs/min

---

## 4. Domain Architecture

Hệ thống được cấu trúc theo nguyên lý **Domain-Driven Design (DDD)**, nhóm thành các vùng chức năng lớn:

| Domain        | Module            | Trách nhiệm chính                                                |
| ------------- | ----------------- | ---------------------------------------------------------------- |
| **Catalog**   | `CatalogModule`   | Products, SKUs, Categories, Brands, Search (Full-text & Vector). |
| **Sales**     | `SalesModule`     | Cart, Orders, Payment, Invoices, Shipping calculation.           |
| **Identity**  | `AuthModule`      | JWT Auth, MFA, Social Login, RBAC (`@RequirePermissions`).       |
| **Inventory** | `InventoryModule` | Multi-warehouse, Stock tracking, Audit logs.                     |
| **Marketing** | `PromotionModule` | Flexible rule-based promotion engine, Loyalty points.            |
| **AI**        | `AiModule`        | RAG-based Chatbot, Product embeddings.                           |

---

## 5. Project Structure Map (`api/src`)

| Directory       | Purpose                                                        |
| --------------- | -------------------------------------------------------------- |
| `core/`         | Infrastructure backbone (Prisma, Redis, Guards, Interceptors). |
| `common/`       | Shared utilities, DTOs, and constants.                         |
| `identity/`     | Auth, Users, Roles, Tenants (Multi-tenancy).                   |
| `catalog/`      | products, categories, brands, skus.                            |
| `sales/`        | Orders, Cart, Payment, Invoices.                               |
| `operations/`   | Inventory, Warehouse, Fulfillment.                             |
| `marketing/`    | Promotions, Loyalty points.                                    |
| `platform/`     | Admin dashboard, Analytics, Reports.                           |
| `cms/`          | Blog, Pages, Media.                                            |
| `ai/`           | AI Chatbot, RAG, Embeddings.                                   |
| `worker/`       | Background job processing (BullMQ consumers).                  |
| `integrations/` | External services (Cloudinary, Nodemailer).                    |
| `audit/`        | System-wide audit logging.                                     |

---

## 6. API Standards

### Unified Response Format

```json
{
  "statusCode": 200,
  "message": "Operation successful",
  "data": { ... },
  "meta": { "total": 100, "page": 1, "limit": 10, "lastPage": 10 }
}
```

### Error Handling

```json
{
  "success": false,
  "error": {
    "statusCode": 404,
    "message": "Product not found",
    "code": "NotFoundException",
    "path": "/api/products/123"
  }
}
```

---

## 7. Backend (Next.js 16 - Shared Logic if any)

### Core

| Package     | Version | Mục đích        |
| ----------- | ------- | --------------- |
| `next`      | 16.x    | React Framework |
| `react`     | 19.x    | UI Library      |
| `react-dom` | 19.x    | DOM Rendering   |

### State & Data

| Package     | Mục đích                             |
| ----------- | ------------------------------------ |
| `zustand`   | Global State Management              |
| `swr`       | Data Fetching & Caching              |
| `nuqs`      | URL State Management (Search Params) |
| `next-intl` | Internationalization (i18n)          |

### Forms

| Package               | Mục đích        |
| --------------------- | --------------- |
| `react-hook-form`     | Form Handling   |
| `@hookform/resolvers` | Zod Integration |
| `zod`                 | Validation      |

### Real-time & Communications

| Package              | Mục đích            |
| -------------------- | ------------------- |
| `@nestjs/websockets` | WebSocket Gateway   |
| `socket.io`          | Socket Server       |
| `socket.io-client`   | Socket Client (Web) |
| `nodemailer`         | Email Service       |

### UI Components (Shadcn System)

| Package                    | Mục đích            |
| -------------------------- | ------------------- |
| `shadcn-ui` (CLI)          | Component System    |
| `@radix-ui/*`              | Headless Primitives |
| `class-variance-authority` | Component Variants  |

| Package                    | Mục đích                 |
| -------------------------- | ------------------------ |
| `@radix-ui/*`              | Headless UI (Accessible) |
| `lucide-react`             | Icons                    |
| `framer-motion`            | Animations               |
| `tailwindcss`              | Styling                  |
| `class-variance-authority` | Variant Styling          |
| `tailwind-merge`           | Class Merging            |

### Rich Text

| Package     | Mục đích       |
| ----------- | -------------- |
| `@tiptap/*` | WYSIWYG Editor |

### Charts

| Package    | Mục đích           |
| ---------- | ------------------ |
| `recharts` | Data Visualization |

### Utilities

| Package            | Mục đích                   |
| ------------------ | -------------------------- |
| `date-fns`         | Date Formatting            |
| `lodash`           | Utility Functions          |
| `jose`             | JWT (Server-side)          |
| `next-safe-action` | Type-safe Server Actions   |
| `middleware.ts`    | Auth Guard & Auto Refresh  |
| `sonner`           | Toast Notifications        |
| `zustand/persist`  | Multi-currency Persistence |

---

## 3. Infrastructure

### Docker Services

| Service    | Image                  | Port              | Env (Local)    |
| ---------- | ---------------------- | ----------------- | -------------- |
| `postgres` | ankane/pgvector:v0.4.1 | 5432              | Docker         |
| `redis`    | redis:7-alpine         | 6385              | Docker         |
| `api`      | Custom (NestJS)        | 8080 (2 replicas) | Local / Docker |
| `web`      | Custom (Next.js)       | 3000              | Local          |

### Production Cloud (Modern Stack)

- **Frontend**: Vercel
- **Backend**: Railway / Render
- **Database**: Neon (Serverless Postgres)
- **Cache/Queue**: Upstash (Redis/Kafka)

### Environment Variables (Required)

```bash
# Database
DATABASE_URL=postgres://...

# Redis
REDIS_URL=redis://...

# Auth
JWT_ACCESS_SECRET=...
JWT_REFRESH_SECRET=...

# Frontend
FRONTEND_URL=http://localhost:3000

# Optional
CLOUDINARY_*
SENTRY_*
GOOGLE_GEMINI_API_KEY
```

---

## 4. Scripts quan trọng

### API

```bash
npm run dev          # Development
npm run build        # Production build
npm run start:prod   # Production start (with migrate)
npm run seed         # Database seeding
npm run lint         # Linting
npm run test         # Unit tests
npm run test:e2e     # E2E tests
```

### Web

```bash
npm run dev          # Development
npm run build        # Production build
npm run start        # Production start
npm run lint         # Linting
npm run test         # Unit tests (Vitest)
npm run test:e2e     # E2E tests (Playwright)
```
