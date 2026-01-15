# Kiến Trúc Hệ Thống - Ecommerce Web

## Tech Stack

| Layer            | Technology                      |
| ---------------- | ------------------------------- |
| Framework        | Next.js 16 (App Router)         |
| Language         | TypeScript (strict mode)        |
| Styling          | Tailwind CSS v4                 |
| UI Components    | Radix UI + shadcn/ui            |
| State Management | Zustand (client) + SWR (server) |
| Forms            | React Hook Form + Zod           |
| Animation        | Framer Motion                   |
| i18n             | next-intl                       |
| Testing          | Vitest + Playwright             |

## Folder Structure

```
d:\ecommerce\web\
├── app/                    # Next.js App Router
│   ├── [locale]/           # i18n routing
│   │   ├── (shop)/         # Customer-facing pages
│   │   ├── admin/          # Admin dashboard
│   │   └── super-admin/    # Super admin (multi-tenant)
│   ├── api/                # API routes
│   └── globals.css         # Global styles
│
├── features/               # Feature-based modules (25+)
│   ├── auth/               # Authentication
│   ├── products/           # Product catalog
│   ├── cart/               # Shopping cart
│   ├── checkout/           # Checkout flow
│   ├── orders/             # Order management
│   ├── admin/              # Admin features
│   └── ...
│
├── components/
│   ├── ui/                 # shadcn/ui primitives
│   └── shared/             # Shared components
│
├── lib/                    # Core utilities
│   ├── http.ts             # API client
│   ├── safe-action.ts      # Server action wrapper
│   ├── session.ts          # Auth session
│   ├── utils.ts            # Common utilities
│   └── schemas.ts          # Zod schemas
│
├── types/                  # TypeScript types
│   ├── models.ts           # Domain models (800+ lines)
│   ├── dtos.ts             # Data transfer objects
│   └── api.ts              # API response types
│
├── providers/              # React context providers
├── contexts/               # Additional contexts
├── i18n/                   # Internationalization
├── messages/               # i18n message files
└── public/                 # Static assets
```

## Types Layer

Types are centralized in the `types/` directory and synced from API:

```
┌──────────────────────────────────────────────────────────┐
│                    types/ Directory                       │
├──────────────────────────────────────────────────────────┤
│  models.ts   │ Domain entities (Product, User, Order)    │
│  dtos.ts     │ API input/output DTOs (synced from API)   │
│  api.ts      │ ApiResponse<T>, PaginationMeta            │
└──────────────────────────────────────────────────────────┘
           ↑
           │ Manual sync (see .agent/docs/type-sync.md)
           │
┌──────────────────────┐
│  API Types (Source)  │
│  api/src/*/dto/*.ts  │
└──────────────────────┘
```

## Data Flow

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Client    │────▶│ Server Action│────▶│  Backend    │
│  Component  │     │ (next-safe-  │     │    API      │
│             │◀────│   action)    │◀────│             │
└─────────────┘     └──────────────┘     └─────────────┘
       │                   │
       ▼                   ▼
┌─────────────┐     ┌──────────────┐
│   Zustand   │     │  revalidate  │
│    Store    │     │    Path      │
└─────────────┘     └──────────────┘
```

## Feature Module Anatomy

Mỗi feature trong `features/` có cấu trúc:

```
features/[domain]/
├── actions.ts           # Server actions (mutations)
├── components/          # UI components
│   ├── [Component].tsx
│   └── index.ts         # Barrel export (optional)
├── hooks/               # Custom React hooks
│   └── use-[hook].ts
├── store/               # Zustand store
│   └── [domain]-store.ts
├── services/            # API service classes (optional)
│   └── [domain].service.ts
├── schemas/             # Zod validation schemas (optional)
├── types/               # Feature-specific types (optional)
└── providers/           # React context providers (optional)
```

## Key Patterns

### 1. Server Actions (Mutations)

```typescript
// features/[domain]/actions.ts
"use server";

export const createItemAction = actionClient
  .schema(itemSchema)
  .action(async ({ parsedInput }) => {
    const result = await http.post("/items", parsedInput);
    revalidatePath("/items");
    return { success: true, data: result };
  });
```

### 2. Client State (Zustand)

```typescript
// features/[domain]/store/[domain]-store.ts
export const useCartStore = create<CartStore>()(
  persist(
    (set) => ({
      items: [],
      addItem: (item) => set((s) => ({ items: [...s.items, item] })),
    }),
    { name: "cart-storage" }
  )
);
```

### 3. Server State (SWR)

```typescript
// features/[domain]/hooks/use-[domain].ts
export function useProducts() {
  return useSWR("/products", fetcher);
}
```

## Authentication Flow

```
Login Form → loginAction() → API /auth/login
                   ↓
           createSession() → Set HttpOnly cookies
                   ↓
           generateCsrfToken() → CSRF protection
                   ↓
           revalidatePath("/") → Update UI
```

## Multi-tenant Architecture

```
Root Domain → Landing Page
app.[tenant].domain → Tenant storefront
admin.[tenant].domain → Tenant admin
super-admin.domain → Platform admin
```
