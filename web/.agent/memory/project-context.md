# 🧠 Project Context: Ecommerce Web

> Cập nhật cuối: 2026-01-15 - Trạng thái: **Active Development**

---

## 1. 🎯 Tổng quan & Nghiệp vụ

### Mục đích

Ứng dụng ecommerce multi-tenant với Next.js, hỗ trợ:

- **Customer-facing**: Mua sắm, giỏ hàng, thanh toán, theo dõi đơn
- **Admin Dashboard**: Quản lý sản phẩm, đơn hàng, khách hàng
- **Super Admin**: Quản lý tenants, plans, subscriptions

### Business Domain

| Domain          | Description             | Evidence                               |
| --------------- | ----------------------- | -------------------------------------- |
| E-commerce      | Sản phẩm, SKU, variants | `features/products/` (29 files)        |
| Cart & Checkout | Giỏ hàng, thanh toán    | `features/cart/`, `features/checkout/` |
| Orders          | Quản lý đơn hàng        | `features/orders/`                     |
| Auth            | Đăng nhập, 2FA, OAuth   | `features/auth/`                       |
| Multi-tenant    | Tenant isolation        | `features/super-admin/`                |

### Happy Path

```
User browses products → Adds to cart → Checkout →
Payment → Order confirmation → Track delivery
```

---

## 2. 🛠️ Hệ sinh thái Công nghệ

| Layer          | Technology            | Version        | Evidence               |
| -------------- | --------------------- | -------------- | ---------------------- |
| Framework      | Next.js (App Router)  | 16.1.1         | `package.json:52`      |
| Language       | TypeScript            | 5.9.3          | `package.json:93`      |
| Runtime        | Node.js               | 20+            | `Dockerfile:15`        |
| Styling        | Tailwind CSS v4       | 4.1.18         | `package.json:91`      |
| UI Components  | Radix UI + shadcn/ui  | -              | Multiple `@radix-ui/*` |
| State (Client) | Zustand               | 5.0.9          | `package.json:74`      |
| State (Server) | SWR                   | 2.3.8          | `package.json:68`      |
| Forms          | React Hook Form + Zod | 7.69.0 / 4.2.1 | `package.json:62,73`   |
| Animation      | Framer Motion         | 12.23.26       | `package.json:46`      |
| i18n           | next-intl             | 4.6.1          | `package.json:53`      |
| Testing        | Vitest + Playwright   | -              | `package.json:94,77`   |

### Internal Utilities

| Utility     | File                 | Purpose                        |
| ----------- | -------------------- | ------------------------------ |
| HTTP Client | `lib/http.ts`        | API requests with retry, dedup |
| Safe Action | `lib/safe-action.ts` | Type-safe server actions       |
| Session     | `lib/session.ts`     | JWT session management         |
| Error Utils | `lib/error-utils.ts` | Error message extraction       |

---

## 3. 🏗️ Kiến trúc Hệ thống

### Pattern: Feature-based Architecture

```
                     ┌─────────────────┐
                     │   Next.js App   │
                     │   (App Router)  │
                     └────────┬────────┘
                              │
          ┌───────────────────┼───────────────────┐
          │                   │                   │
   ┌──────▼──────┐    ┌───────▼───────┐   ┌───────▼───────┐
   │   features/ │    │  components/  │   │     lib/      │
   │  (domains)  │    │  (shared UI)  │   │  (utilities)  │
   └──────┬──────┘    └───────────────┘   └───────────────┘
          │
   ┌──────▼──────────────────────────────────────────┐
   │  Each feature:                                   │
   │  - actions.ts (Server Actions)                   │
   │  - components/ (UI)                              │
   │  - hooks/ (Custom hooks)                         │
   │  - store/ (Zustand)                              │
   └──────────────────────────────────────────────────┘
```

### Data Flow

```
Client Component
    → Server Action (next-safe-action)
    → HTTP Client (lib/http.ts)
    → Backend API (external)
    → Response
    → Zustand Store update (optimistic)
    → revalidatePath()
    → UI re-render
```

### Key Files ("Trái tim" hệ thống)

| File                 | Purpose                                     |
| -------------------- | ------------------------------------------- |
| `lib/http.ts`        | API client với retry, dedup, error handling |
| `lib/session.ts`     | JWT session, cookies management             |
| `lib/safe-action.ts` | Type-safe server actions wrapper            |
| `app/globals.css`    | Design system (OKLCH, Quiet Luxury theme)   |
| `types/models.ts`    | 800+ lines domain models                    |

---

## 4. 📂 Quy hoạch Thư mục

```
d:\ecommerce\web\
├── app/                    # Next.js App Router
│   ├── [locale]/           # i18n routing
│   │   ├── (shop)/         # Customer pages (grouped)
│   │   ├── admin/          # Admin dashboard
│   │   └── super-admin/    # Platform admin
│   └── globals.css         # Design system
│
├── features/               # 25 feature modules
│   ├── auth/               # Authentication (8 files)
│   ├── products/           # Product catalog (29 files)
│   ├── cart/               # Shopping cart (10 files)
│   ├── admin/              # Admin features (81 files)
│   └── ...
│
├── components/
│   ├── ui/                 # shadcn/ui primitives
│   └── shared/             # Shared components (65 files)
│
├── lib/                    # Core utilities (20 files)
│   ├── http.ts             # API client
│   ├── session.ts          # Auth session
│   └── utils.ts            # Common helpers
│
└── types/                  # TypeScript types
    ├── models.ts           # Domain entities
    └── dtos.ts             # Data transfer objects
```

---

## 5. 🚥 Trạng thái & Metrics

### Hoàn thành

- [x] Authentication (login, register, 2FA, OAuth)
- [x] Product catalog (listing, filters, search)
- [x] Shopping cart (guest + auth)
- [x] Checkout flow
- [x] Order management
- [x] Admin dashboard
- [x] Multi-tenant super admin

### Code Metrics

| Metric             | Value                           |
| ------------------ | ------------------------------- |
| Feature modules    | 25                              |
| Total components   | 65+ shared + feature components |
| TypeScript models  | 800+ lines in `types/models.ts` |
| useCallback usages | 107+                            |
| useMemo usages     | 60+                             |
| `any` types        | ~176 (technical debt)           |

---

## 6. 🚧 Technical Debt

| Item             | Severity  | Description                         |
| ---------------- | --------- | ----------------------------------- |
| `any` types      | 🔴 High   | ~176 occurrences need proper typing |
| `as any` routing | 🟡 Medium | Next.js i18n href workaround (~173) |
| No unit tests    | 🔴 High   | Only config exists, no actual tests |
| Commit messages  | 🟡 Medium | Mostly "update code", no convention |

### Không tìm thấy

- TODO/FIXME comments (code sạch)
- Error tracking (Sentry) integration
- Logging library (only console.log)

---

## 7. ⚙️ Cấu hình & Vận hành

### Environment Variables

```bash
# Required
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1  # Client-side
API_URL=http://api:8080/api/v1                    # Server-side (Docker)
```

### Commands

```bash
# Development
npm run dev

# Build
npm run build

# Testing
npm test              # Vitest watch
npm run test:run      # Vitest once
npm run test:e2e      # Playwright

# Linting
npm run lint
npx tsc --noEmit
```

### Docker

```bash
# Build and run
docker compose up -d --build

# Requires external network from API
# Network: api_ecommerce_network
```

---

## 8. 📝 Changelog

### 2026-01-15

- Tạo `.agent` structure với:
  - `rules/`: global.md, ui-components.md, state-management.md, api-integration.md
  - `checklists/`: pr-review.md, feature-deployment.md, ecommerce-logic.md
  - `workflows/`: create-new-feature.md, fix-bug-flow.md
  - `templates/`: component.template.md
  - `skills/`: review/, debug/, performance/
  - `docs/`: architecture.md
  - `memory/`: project-context.md
  - `mocks/`: sample-data.json
