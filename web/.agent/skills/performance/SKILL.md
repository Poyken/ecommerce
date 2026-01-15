---
name: Performance Skill
description: Kỹ năng tối ưu hiệu suất cho Next.js + React
---

# Performance Skill

## 🎯 Trigger Phrases

**Kích hoạt khi user nói:**

- "Sao nó lag?", "Chậm quá", "Optimize cái này"
- "Tối ưu performance", "Giảm re-render"
- "Bundle size lớn", "Load chậm"

**Kích hoạt khi context:**

- Thấy code có `map` lồng nhau
- Thấy inline functions trong JSX props
- Thấy fetch data trong useEffect
- User hỏi về Web Vitals, LCP, FID

---

## Mục đích

Skill này hướng dẫn cách phát hiện và khắc phục các vấn đề performance trong dự án.

## Performance Checklist

### 1. React Component Optimization

#### Memoization

```tsx
// ❌ Re-render mỗi khi parent render
function ProductList({ products, onSelect }) {
  return products.map((p) => (
    <ProductCard
      key={p.id}
      product={p}
      onSelect={() => onSelect(p.id)} // New function mỗi render!
    />
  ));
}

// ✅ Stable reference với useCallback
function ProductList({ products, onSelect }) {
  const handleSelect = useCallback(
    (id: string) => {
      onSelect(id);
    },
    [onSelect]
  );

  return products.map((p) => (
    <ProductCard key={p.id} product={p} onSelect={handleSelect} />
  ));
}
```

#### Expensive Computations

```tsx
// ❌ Tính toán mỗi render
function Stats({ orders }) {
  const total = orders.reduce((sum, o) => sum + o.amount, 0); // Chạy mỗi render

  return <div>Total: {total}</div>;
}

// ✅ Memoize kết quả
function Stats({ orders }) {
  const total = useMemo(
    () => orders.reduce((sum, o) => sum + o.amount, 0),
    [orders]
  );

  return <div>Total: {total}</div>;
}
```

### 2. Image Optimization

```tsx
// Dự án đã có OptimizedImage component
import { OptimizedImage } from "@/components/shared";

<OptimizedImage
  src={imageUrl}
  alt={name}
  fill
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
  className="object-cover"
  showShimmer={true} // Loading skeleton
/>;
```

**Best practices:**

- Luôn specify `sizes` để browser tải đúng size
- Dùng `priority` cho above-the-fold images
- Dùng `loading="lazy"` cho images dưới fold

### 3. Code Splitting

```tsx
// Lazy load heavy components
import dynamic from "next/dynamic";

const RichTextEditor = dynamic(
  () => import("@/components/shared/lazy-rich-text-editor"),
  {
    loading: () => <Skeleton className="h-40" />,
    ssr: false,
  }
);
```

### 4. Data Fetching Optimization

#### Parallel Fetching

```tsx
// ❌ Sequential (chậm)
const products = await fetchProducts();
const categories = await fetchCategories();

// ✅ Parallel (nhanh)
const [products, categories] = await Promise.all([
  fetchProducts(),
  fetchCategories(),
]);
```

#### Prefetching

```tsx
// Dự án đã có pattern này
const handleMouseEnter = useCallback(() => {
  router.prefetch(`/products/${id}` as any);
}, [id, router]);
```

### 5. Bundle Analysis

```bash
# Analyze bundle
npm run build -- --analyze

# Hoặc dùng @next/bundle-analyzer
```

**Targets:**

- First Load JS: < 100KB
- Largest Contentful Paint (LCP): < 2.5s
- Time to Interactive (TTI): < 3.8s

### 6. React Compiler (đã bật)

Dự án đã có `babel-plugin-react-compiler`:

```javascript
// package.json
"babel-plugin-react-compiler": "^1.0.0"
```

React Compiler tự động memoize, nhưng vẫn cần:

- Tránh side effects trong render
- Giữ component pure

## Performance Anti-patterns

| Anti-pattern                 | Fix                                      |
| ---------------------------- | ---------------------------------------- |
| Fetch trong useEffect        | Dùng Server Components                   |
| Large inline objects         | Extract to constants                     |
| Anonymous functions as props | useCallback                              |
| Rendering huge lists         | Virtualization (@tanstack/react-virtual) |
| Blocking main thread         | Web Workers                              |

## Monitoring

```typescript
// Web Vitals tracking
import { onCLS, onFID, onLCP } from "web-vitals";

onCLS(console.log);
onFID(console.log);
onLCP(console.log);
```
