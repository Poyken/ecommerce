# Web Architecture

## Overview

Next.js 14+ App Router với Server Components, Server Actions, và hybrid state management.

---

## Layer Architecture

```
┌─────────────────────────────────────────────────────────┐
│                   SERVER COMPONENTS                      │
│  Data fetching, SEO, initial render                     │
└─────────────────────────┬───────────────────────────────┘
                          │ Props / Hydration
┌─────────────────────────▼───────────────────────────────┐
│                   CLIENT COMPONENTS                      │
│  Interactivity, event handlers, animations              │
└─────────────────────────┬───────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────┐
│              STATE MANAGEMENT (Hybrid)                   │
│  Context (server data) + Zustand (client state)         │
└─────────────────────────┬───────────────────────────────┘
                          │
┌─────────────────────────▼───────────────────────────────┐
│                   SERVER ACTIONS                         │
│  Mutations, form handling, API calls                    │
└─────────────────────────────────────────────────────────┘
```

---

## Folder Structure

```
web/
├── app/                     # App Router
│   └── [locale]/            # i18n routes
│       ├── (shop)/          # Customer-facing
│       │   ├── products/
│       │   ├── cart/
│       │   └── checkout/
│       └── (admin)/         # Admin panel
│           └── admin/
│
├── components/              # Shared UI components
│   ├── shared/              # Common (buttons, inputs)
│   └── ui/                  # shadcn/ui components
│
├── features/                # Feature modules
│   ├── auth/
│   │   ├── actions/         # Server actions
│   │   ├── components/      # Feature components
│   │   └── providers/       # Context providers
│   ├── cart/
│   │   ├── actions/
│   │   ├── components/
│   │   └── store/           # Zustand store
│   ├── products/
│   └── ...
│
├── lib/                     # Utilities
│   ├── hooks/               # Custom hooks
│   ├── http.ts              # API client
│   └── utils.ts             # Helpers
│
└── messages/                # i18n translations
```

---

## State Management

### When to use what:

| Use Case                   | Solution                               |
| -------------------------- | -------------------------------------- |
| Server-injected data       | Context (AuthProvider, TenantProvider) |
| Client-only reactive state | Zustand (cart.store, wishlist.store)   |
| Form state                 | React Hook Form                        |
| API caching                | SWR                                    |

### Existing Stores (Zustand):

```
features/
├── admin/store/feature-flag.store.ts
├── cart/store/cart.store.ts
├── notifications/store/notification.store.ts
├── products/store/
│   ├── quick-view.store.ts
│   └── recently-viewed.store.ts
└── wishlist/store/wishlist.store.ts
```

### Context Providers:

```
features/
├── auth/providers/auth-provider.tsx      # RBAC permissions
├── layout/providers/layout-visibility-provider.tsx
└── ...
```

---

## Data Flow

### Server Component (Read):

```tsx
// app/[locale]/(shop)/products/page.tsx
async function ProductsPage() {
  const products = await getProducts(); // Server fetch
  return <ProductList products={products} />;
}
```

### Server Action (Mutate):

```tsx
// features/cart/actions/index.ts
"use server";
export async function addToCartAction(skuId: string, qty: number) {
  const res = await http.post("/cart", { skuId, qty });
  revalidatePath("/cart");
  return res;
}
```

### Client Interaction:

```tsx
"use client";
import { useCartStore } from "@/features/cart/store/cart.store";

function AddToCartButton({ skuId }) {
  const { increment } = useCartStore();

  async function handleClick() {
    await addToCartAction(skuId, 1);
    increment(); // Optimistic UI update
  }

  return <button onClick={handleClick}>Add to Cart</button>;
}
```

---

## Key Patterns

### 1. Feature-based Organization

```
features/[feature]/
├── actions/     # Server actions
├── components/  # UI components
├── hooks/       # Custom hooks
├── store/       # Zustand (if needed)
└── types/       # TypeScript types
```

### 2. Barrel Exports

```typescript
// features/cart/index.ts
export * from "./actions";
export * from "./components";
export * from "./store/cart.store";
```

### 3. Server/Client Boundary

```tsx
// Server Component (default)
async function Page() {
  const data = await fetchData();
  return <ClientComponent data={data} />;
}

// Client Component (explicit)
("use client");
function ClientComponent({ data }) {
  const [state, setState] = useState(data);
  // ...
}
```

---

## Styling

- **Framework**: Tailwind CSS
- **Components**: shadcn/ui
- **Animations**: Framer Motion
- **Icons**: Lucide React

---

## i18n

- **Library**: next-intl
- **Locales**: `messages/[locale].json`
- **Routing**: `/[locale]/...`

---

## Performance

| Technique              | Implementation     |
| ---------------------- | ------------------ |
| **SSR/SSG**            | App Router default |
| **Image optimization** | next/image         |
| **Code splitting**     | Dynamic imports    |
| **Caching**            | SWR, fetch cache   |
| **Skeletons**          | Loading states     |
