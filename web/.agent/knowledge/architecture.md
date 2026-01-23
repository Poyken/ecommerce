# Frontend Architecture

> Technical architecture documentation for the Next.js Web application.

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        APP LAYER                             │
│                   (Next.js App Router)                       │
│   - Layout components                                        │
│   - Page components (routes)                                 │
│   - Loading/Error boundaries                                 │
├─────────────────────────────────────────────────────────────┤
│                      FEATURES LAYER                          │
│   - Feature modules (products, cart, auth, etc.)             │
│   - Each feature: components + hooks + actions + schemas     │
├─────────────────────────────────────────────────────────────┤
│                     COMPONENTS LAYER                         │
│   - Shared UI components (Shadcn/ui based)                   │
│   - Layout components (Header, Footer, Sidebar)              │
├─────────────────────────────────────────────────────────────┤
│                        LIB LAYER                             │
│   - API client (http.ts)                                     │
│   - Auth utilities (session.ts)                              │
│   - Shared schemas (schemas.ts)                              │
│   - Safe action clients (safe-action.ts)                     │
├─────────────────────────────────────────────────────────────┤
│                     PROVIDERS LAYER                          │
│   - ThemeProvider                                            │
│   - SessionProvider                                          │
│   - QueryProvider                                            │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Directory Structure

```
web/
├── app/                    # Next.js App Router
│   ├── (auth)/             # Auth route group
│   │   ├── login/
│   │   └── register/
│   ├── (shop)/             # Shop route group
│   │   ├── products/
│   │   ├── cart/
│   │   └── checkout/
│   ├── (admin)/            # Admin route group
│   │   └── admin/
│   ├── layout.tsx          # Root layout
│   └── page.tsx            # Home page
├── components/             # Shared components
│   ├── ui/                 # Shadcn/ui components
│   └── layout/             # Layout components
├── features/               # Feature modules
│   ├── auth/
│   ├── products/
│   ├── cart/
│   └── admin/
├── lib/                    # Utilities
│   ├── http.ts             # API client
│   ├── safe-action.ts      # Server action clients
│   ├── session.ts          # Auth session
│   └── utils.ts            # Helpers
├── providers/              # React providers
├── types/                  # Global types
└── public/                 # Static assets
```

---

## 3. Data Flow

### 3.1 Read Operations (SWR)

```
Component → useQuery Hook → SWR → API Client → NestJS API
                ↓
           Cache Layer
```

### 3.2 Write Operations (Server Actions)

```
Component → useAction Hook → Server Action → API Client → NestJS API
                                  ↓
                          Revalidation
```

---

## 4. Authentication Flow

```
1. Login Request
   └── /api/auth/login (API route)
       └── Set HTTP-only cookies (accessToken, refreshToken)

2. Authenticated Request
   └── middleware.ts
       └── Read accessToken from cookies
       └── Attach to API request
       └── Auto-refresh if expired

3. Session Check
   └── getSession() utility
       └── Read from cookies
       └── Verify JWT
       └── Return user info
```

---

## 5. State Management

### 5.1 Global State (Zustand)

Used for:

- Shopping cart (persisted)
- User preferences (theme, currency)
- UI state (modals, sidebars)

```tsx
// stores/cart.store.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface CartStore {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  // ...
}

export const useCartStore = create<CartStore>()(
  persist(
    (set) => ({
      items: [],
      addItem: (item) =>
        set((state) => ({
          items: [...state.items, item],
        })),
    }),
    { name: "cart-storage" },
  ),
);
```

### 5.2 Server State (SWR)

Used for:

- Product listings
- User data
- Order history

### 5.3 URL State (nuqs)

Used for:

- Search filters
- Pagination
- Sort options

```tsx
import { useQueryState } from "nuqs";

function ProductFilters() {
  const [category, setCategory] = useQueryState("category");
  const [sort, setSort] = useQueryState("sort", { defaultValue: "newest" });
  // ...
}
```

---

## 6. API Client

### 6.1 HTTP Client Configuration

```tsx
// lib/http.ts
const API_BASE = process.env.NEXT_PUBLIC_API_URL;

export async function fetchApi<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    credentials: "include", // For cookies
  });

  if (!response.ok) {
    throw new ApiError(response.status, await response.json());
  }

  return response.json();
}
```

---

## 7. Error Handling

### 7.1 Error Boundaries

```tsx
// app/error.tsx
"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h2>Something went wrong!</h2>
      <button onClick={reset}>Try again</button>
    </div>
  );
}
```

### 7.2 Action Error Handling

```tsx
import { toast } from "sonner";

// In hook
const { execute, result } = useAction(myAction, {
  onError: (error) => {
    toast.error(error.serverError || "An error occurred");
  },
});
```

---

## 8. Performance Optimizations

### 8.1 Image Optimization

- Use Next.js `Image` component
- Implement blur placeholders
- Lazy load below-fold images

### 8.2 Code Splitting

- Dynamic imports for heavy components
- Route-based splitting (automatic)

### 8.3 Caching Strategy

- SWR cache for API responses
- Revalidate on focus
- Stale-while-revalidate pattern

---

## 9. SEO

### 9.1 Metadata

```tsx
// app/products/[slug]/page.tsx
export async function generateMetadata({ params }) {
  const product = await getProduct(params.slug);

  return {
    title: product.name,
    description: product.description,
    openGraph: {
      images: [product.imageUrl],
    },
  };
}
```

### 9.2 Structured Data

```tsx
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{
    __html: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Product",
      name: product.name,
      // ...
    }),
  }}
/>
```

---

## 10. Testing Strategy

| Type      | Tool                     | Scope            |
| --------- | ------------------------ | ---------------- |
| Unit      | Vitest                   | Utilities, Hooks |
| Component | Vitest + Testing Library | Components       |
| E2E       | Playwright               | Critical flows   |
