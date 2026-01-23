# Feature Module Structure Guidelines

> Standard structure for all feature modules in the Web project.

---

## 1. Standard Structure

```
features/<feature-name>/
├── components/           # React UI components
│   ├── <feature>-list.tsx
│   ├── <feature>-card.tsx
│   ├── <feature>-form.tsx
│   └── <feature>-skeleton.tsx
├── hooks/                # Custom React hooks
│   ├── use-<feature>.ts
│   ├── use-<feature>-mutation.ts
│   └── use-<feature>-query.ts
├── actions/              # Server Actions
│   ├── get-<feature>.action.ts
│   ├── create-<feature>.action.ts
│   └── update-<feature>.action.ts
├── schemas/              # Zod validation schemas
│   ├── <feature>.schema.ts
│   └── <feature>-form.schema.ts
├── types/                # TypeScript types
│   └── <feature>.types.ts
├── utils/                # Feature-specific utilities
│   └── <feature>-helpers.ts
└── index.ts              # Public exports
```

---

## 2. File Naming Conventions

| Type       | Convention                          | Example                  |
| ---------- | ----------------------------------- | ------------------------ |
| Components | PascalCase                          | `ProductCard.tsx`        |
| Hooks      | camelCase with `use-` prefix        | `use-products.ts`        |
| Actions    | kebab-case with `.action.ts` suffix | `get-products.action.ts` |
| Schemas    | kebab-case with `.schema.ts` suffix | `product.schema.ts`      |
| Types      | kebab-case with `.types.ts` suffix  | `product.types.ts`       |

---

## 3. Component Standards

### 3.1 Component Structure

```tsx
// ✅ GOOD: Well-structured component
"use client";

import { useState } from "react";
import { ProductCardProps } from "../types/product.types";
import { formatPrice } from "../utils/product-helpers";

export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const [isLoading, setIsLoading] = useState(false);

  // Early return for loading state
  if (!product) return <ProductCardSkeleton />;

  return <div className="group relative">{/* Component content */}</div>;
}
```

### 3.2 Skeleton Components

Always provide skeleton components for loading states:

```tsx
export function ProductCardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="bg-muted h-48 rounded-lg" />
      <div className="mt-2 h-4 bg-muted rounded w-3/4" />
      <div className="mt-1 h-4 bg-muted rounded w-1/2" />
    </div>
  );
}
```

---

## 4. Hooks Standards

### 4.1 Query Hook (Data Fetching)

```tsx
// ✅ GOOD: SWR-based query hook
import useSWR from "swr";
import { fetcher } from "@/lib/http";
import { Product } from "../types/product.types";

export function useProducts(categoryId?: string) {
  const { data, error, isLoading, mutate } = useSWR<Product[]>(
    categoryId ? `/products?categoryId=${categoryId}` : "/products",
    fetcher,
  );

  return {
    products: data ?? [],
    isLoading,
    isError: !!error,
    refresh: mutate,
  };
}
```

### 4.2 Mutation Hook

```tsx
// ✅ GOOD: Mutation with optimistic updates
import { useAction } from "next-safe-action/hooks";
import { addToCartAction } from "../actions/add-to-cart.action";
import { toast } from "sonner";

export function useAddToCart() {
  const { execute, status, result } = useAction(addToCartAction, {
    onSuccess: () => {
      toast.success("Added to cart!");
    },
    onError: (error) => {
      toast.error(error.serverError || "Failed to add to cart");
    },
  });

  return {
    addToCart: execute,
    isLoading: status === "executing",
    error: result.serverError,
  };
}
```

---

## 5. Server Actions Standards

### 5.1 Protected Action

```tsx
// ✅ GOOD: Using protectedActionClient
"use server";

import { protectedActionClient } from "@/lib/safe-action";
import { createProductSchema } from "../schemas/product.schema";

export const createProductAction = protectedActionClient
  .schema(createProductSchema)
  .action(async ({ parsedInput, ctx }) => {
    const { user, tenantId } = ctx;

    // Business logic here
    const product = await createProduct({
      ...parsedInput,
      tenantId,
      createdBy: user.id,
    });

    return { product };
  });
```

### 5.2 Public Action

```tsx
// For public actions (no auth required)
import { actionClient } from "@/lib/safe-action";

export const getProductsAction = actionClient
  .schema(filterProductsSchema)
  .action(async ({ parsedInput }) => {
    // ...
  });
```

---

## 6. Schema Standards

### 6.1 Form Schema

```tsx
import { z } from "zod";

export const productFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(200),
  description: z.string().optional(),
  price: z.number().positive("Price must be positive"),
  categoryId: z.string().uuid("Invalid category"),
});

export type ProductFormData = z.infer<typeof productFormSchema>;
```

### 6.2 API Response Schema

```tsx
export const productResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  price: z.number(),
  // ...
});

export type ProductResponse = z.infer<typeof productResponseSchema>;
```

---

## 7. Types Standards

```tsx
// ✅ GOOD: Derive types from schemas when possible
import { z } from "zod";
import {
  productResponseSchema,
  productFormSchema,
} from "../schemas/product.schema";

// Inferred from schema
export type Product = z.infer<typeof productResponseSchema>;
export type ProductFormData = z.infer<typeof productFormSchema>;

// Additional types
export interface ProductCardProps {
  product: Product;
  onAddToCart?: (productId: string) => void;
  showQuickView?: boolean;
}

export interface UseProductsOptions {
  categoryId?: string;
  brandId?: string;
  limit?: number;
}
```

---

## 8. Index Exports

```tsx
// features/products/index.ts

// Components
export { ProductCard } from "./components/product-card";
export { ProductList } from "./components/product-list";
export { ProductForm } from "./components/product-form";

// Hooks
export { useProducts } from "./hooks/use-products";
export { useProduct } from "./hooks/use-product";

// Actions
export { getProductsAction } from "./actions/get-products.action";
export { createProductAction } from "./actions/create-product.action";

// Types
export type { Product, ProductCardProps } from "./types/product.types";
```

---

## 9. Common Mistakes to Avoid

1. ❌ Direct fetch in components (use hooks)
2. ❌ Business logic in components (move to hooks/actions)
3. ❌ Inline validation (use Zod schemas)
4. ❌ Missing loading/error states
5. ❌ Non-accessible components (use Radix primitives)
6. ❌ Missing TypeScript types
7. ❌ Importing internal modules from outside feature
