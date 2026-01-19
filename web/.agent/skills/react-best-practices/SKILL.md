---
name: react-best-practices
description: Vercel React/Next.js Best Practices - 50+ rules tối ưu performance cho React và Next.js applications.
source: https://github.com/vercel-labs/agent-skills
---

# Skill: React Best Practices (Vercel)

## When to Apply

Áp dụng các guidelines này khi:

- Viết React components hoặc Next.js pages mới
- Implement data fetching (client hoặc server-side)
- Review code về performance issues
- Refactor React/Next.js code hiện có
- Tối ưu bundle size hoặc load times

---

## Rule Categories by Priority

| Priority | Category                  | Impact      | Prefix       |
| -------- | ------------------------- | ----------- | ------------ |
| 1        | Eliminating Waterfalls    | CRITICAL    | `async-`     |
| 2        | Bundle Size Optimization  | CRITICAL    | `bundle-`    |
| 3        | Server-Side Performance   | HIGH        | `server-`    |
| 4        | Client-Side Data Fetching | MEDIUM-HIGH | `client-`    |
| 5        | Re-render Optimization    | MEDIUM      | `rerender-`  |
| 6        | Rendering Performance     | MEDIUM      | `rendering-` |
| 7        | JavaScript Performance    | LOW-MEDIUM  | `js-`        |
| 8        | Advanced Patterns         | LOW         | `advanced-`  |

---

## Quick Reference

### 1. Eliminating Waterfalls (CRITICAL)

| Rule                        | Mô tả                                           |
| --------------------------- | ----------------------------------------------- |
| `async-defer-await`         | Move `await` vào branches thực sự cần dùng      |
| `async-parallel`            | Dùng `Promise.all()` cho các operations độc lập |
| `async-dependencies`        | Dùng better-all cho partial dependencies        |
| `async-api-routes`          | Start promises sớm, await muộn trong API routes |
| `async-suspense-boundaries` | Dùng Suspense để stream content                 |

```typescript
// ❌ Bad: Sequential
const user = await getUser();
const posts = await getPosts();

// ✅ Good: Parallel
const [user, posts] = await Promise.all([getUser(), getPosts()]);
```

### 2. Bundle Size Optimization (CRITICAL)

| Rule                       | Mô tả                                      |
| -------------------------- | ------------------------------------------ |
| `bundle-barrel-imports`    | Import trực tiếp, tránh barrel files       |
| `bundle-dynamic-imports`   | Dùng `next/dynamic` cho heavy components   |
| `bundle-defer-third-party` | Load analytics/logging sau hydration       |
| `bundle-conditional`       | Load modules chỉ khi feature được activate |
| `bundle-preload`           | Preload on hover/focus cho perceived speed |

```typescript
// ❌ Bad: Barrel import
import { Button, Modal, Table } from "@/components";

// ✅ Good: Direct import
import { Button } from "@/components/ui/button";
```

### 3. Server-Side Performance (HIGH)

| Rule                       | Mô tả                                              |
| -------------------------- | -------------------------------------------------- |
| `server-cache-react`       | Dùng `React.cache()` cho per-request deduplication |
| `server-cache-lru`         | Dùng LRU cache cho cross-request caching           |
| `server-serialization`     | Minimize data passed to client components          |
| `server-parallel-fetching` | Restructure components để parallelize fetches      |
| `server-after-nonblocking` | Dùng `after()` cho non-blocking operations         |

### 4. Client-Side Data Fetching (MEDIUM-HIGH)

| Rule                     | Mô tả                                                                                      |
| ------------------------ | ------------------------------------------------------------------------------------------ |
| `client-swr-dedup`       | Dùng SWR cho automatic request deduplication                                               |
| `client-event-listeners` | Deduplicate global event listeners                                                         |
| `client-prefetch-hover`  | Dùng `preload` (SWR) hoặc `router.prefetch` khi hover vào links/cards. (See `ProductCard`) |

### 5. Re-render Optimization (MEDIUM)

| Rule                           | Mô tả                                           |
| ------------------------------ | ----------------------------------------------- |
| `rerender-defer-reads`         | Không subscribe state chỉ dùng trong callbacks  |
| `rerender-memo`                | Extract expensive work vào memoized components  |
| `rerender-dependencies`        | Dùng primitive dependencies trong effects       |
| `rerender-derived-state`       | Subscribe derived booleans, không raw values    |
| `rerender-functional-setstate` | Dùng functional setState cho stable callbacks   |
| `rerender-lazy-state-init`     | Pass function vào useState cho expensive values |
| `rerender-transitions`         | Dùng `startTransition` cho non-urgent updates   |

```typescript
// ❌ Bad: Re-renders on every items change
const hasItems = items.length > 0;

// ✅ Good: Memoized derived state
const hasItems = useMemo(() => items.length > 0, [items.length]);
```

### 6. Rendering Performance (MEDIUM)

| Rule                             | Mô tả                                     |
| -------------------------------- | ----------------------------------------- |
| `rendering-animate-svg-wrapper`  | Animate div wrapper, không SVG element    |
| `rendering-content-visibility`   | Dùng `content-visibility` cho long lists  |
| `rendering-hoist-jsx`            | Extract static JSX ra ngoài components    |
| `rendering-svg-precision`        | Giảm SVG coordinate precision             |
| `rendering-hydration-no-flicker` | Dùng inline script cho client-only data   |
| `rendering-activity`             | Dùng Activity component cho show/hide     |
| `rendering-conditional-render`   | Dùng ternary, không `&&` cho conditionals |

```typescript
// ❌ Bad: Can render 0 or false
{
  count && <Badge count={count} />;
}

// ✅ Good: Explicit ternary
{
  count > 0 ? <Badge count={count} /> : null;
}
```

### 7. JavaScript Performance (LOW-MEDIUM)

| Rule                        | Mô tả                                         |
| --------------------------- | --------------------------------------------- |
| `js-batch-dom-css`          | Group CSS changes qua classes hoặc cssText    |
| `js-index-maps`             | Build Map cho repeated lookups                |
| `js-cache-property-access`  | Cache object properties trong loops           |
| `js-cache-function-results` | Cache function results trong module-level Map |
| `js-cache-storage`          | Cache localStorage/sessionStorage reads       |
| `js-combine-iterations`     | Combine nhiều filter/map thành một loop       |
| `js-length-check-first`     | Check array length trước expensive comparison |
| `js-early-exit`             | Return early từ functions                     |
| `js-hoist-regexp`           | Hoist RegExp creation ra ngoài loops          |
| `js-min-max-loop`           | Dùng loop cho min/max thay vì sort            |
| `js-set-map-lookups`        | Dùng Set/Map cho O(1) lookups                 |
| `js-tosorted-immutable`     | Dùng `toSorted()` cho immutability            |

### 8. Advanced Patterns (LOW)

| Rule                          | Mô tả                              |
| ----------------------------- | ---------------------------------- |
| `advanced-event-handler-refs` | Store event handlers trong refs    |
| `advanced-use-latest`         | useLatest cho stable callback refs |
