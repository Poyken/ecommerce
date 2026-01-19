---
description: Quy trình khởi tạo dự án Ecommerce từ đầu (Fresh Start)
---

# Workflow: Fresh Start Implementation

Quy trình chuẩn để khởi tạo dự án Ecommerce từ số 0.

---

## Phase 1: Foundation (Ngày 1-2)

### 1.1 Monorepo Setup

```bash
# Tại root directory
pnpm init


# Tạo pnpm-workspace.yaml
packages:
  - 'api'
  - 'web'
  - 'packages/*'
```

### 1.2 Shared Package

```bash
mkdir -p packages/shared/src/{schemas,constants}
```

- Tạo Zod schemas cho: User, Product, Order
- Export constants: OrderStatus, PaymentStatus

### 1.3 API Scaffold

```bash
npx @nestjs/cli new api --package-manager pnpm
cd api
pnpm add prisma @prisma/client zod
npx prisma init
```

### 1.4 Web Scaffold

```bash
npx create-next-app@latest web --typescript --tailwind --app
cd web
pnpm add zod @hookform/resolvers react-hook-form zustand swr
```

---

## Phase 2: Core Infrastructure (Ngày 3-5)

### 2.1 Database Schema

Tham khảo: `.agent/knowledge/database-schema.md`

Priority order:

1. Tenant, TenantSettings
2. User, Role, Permission (RBAC)
3. Category, Brand, Product, SKU
4. Cart, Order, OrderItem, Payment

### 2.2 Core Modules (API)

```
src/
├── core/
│   ├── prisma/          # Database module
│   ├── redis/           # Cache module
│   ├── guards/          # JWT, RBAC, Tenant
│   ├── interceptors/    # Logging, Audit
│   └── filters/         # Exception handling
```

### 2.3 Auth System

- JWT Access + Refresh tokens
- Social Login (Google, Facebook)
- 2FA (TOTP)

---

## Phase 3: Business Logic (Ngày 6-10)

### 3.1 Catalog Module

- CRUD Category, Brand
- Product với multiple SKUs
- ProductOptions + OptionValues
- Image upload (Cloudinary)

### 3.2 Cart & Checkout

- Add to cart
- Update quantity
- Apply promotions
- Address selection
- Shipping calculation

### 3.3 Order Processing

- Create order from cart
- Payment integration (COD, MOMO)
- Order status management
- Email notifications

---

## Phase 4: Advanced Features (Ngày 11-15)

### 4.1 Inventory

- Warehouse management
- Stock tracking
- Low stock alerts

### 4.2 Promotions

- Rule-based discounts
- Coupon codes
- Usage limits

### 4.3 Returns (RMA)

- Return request flow
- Refund processing

---

## Phase 5: Polish (Ngày 16-20)

### 5.1 Admin Dashboard

- Analytics
- Reports
- User management

### 5.2 Storefront

- SEO optimization
- Performance tuning
- Mobile responsive

### 5.3 Testing

- E2E tests cho critical paths
- Load testing

---

## Checklist trước khi Live

- [ ] Database migrations applied
- [ ] Environment variables configured
- [ ] SSL certificates
- [ ] Monitoring (Sentry) setup
- [ ] Backup strategy
- [ ] Rate limiting configured
- [ ] CORS properly set

## Phase 6: Deployment (Modern Stack)

Refer to `knowledge/architecture.md` (ADR-009) for Strategy.

### 6.1 Database (Neon)

1. Tạo Project trên Neon Console.
2. Lấy `DATABASE_URL` (Pooling mode).
3. Set vào Environment Variables của cả API và Web.

### 6.2 Backend (Railway)

1. Connect Github Repo.
2. Config Start Command: `node dist/main` (cho NestJS).
3. Add Env Vars: `DATABASE_URL`, `REDIS_URL` (Upstash), `JWT_SECRET`.
4. Generate Domain (e.g., `api-production.up.railway.app`).

### 6.3 Frontend (Vercel)

1. Import Github Repo.
2. Framework Preset: Next.js.
3. Add Env Vars: `NEXT_PUBLIC_API_URL`.
4. Deploy & Enjoy!
