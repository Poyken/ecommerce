# Quy tắc UI Components - Ecommerce Web

> ⚠️ Các quy tắc này được rút ra từ code hiện có, KHÔNG phải lý thuyết.

---

## 1. Component Design System

### Props Pattern

| Pattern             | Usage         | Evidence                          |
| ------------------- | ------------- | --------------------------------- |
| Separated Interface | ✅ Chủ yếu    | `ProductCardBaseProps` tách riêng |
| Inline Types        | ❌ Hiếm       | -                                 |
| Generic Props       | ❌ Không dùng | -                                 |

**Evidence - Separated Interface:**

```tsx
// features/products/components/product-card-base.tsx:12-39
export interface ProductCardBaseProps {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  imageUrl: string;
  category?: string;
  rating?: number;
  reviewCount?: number;

  // State flags
  isNew?: boolean;
  isHot?: boolean;
  isSale?: boolean;
  isLowStock?: boolean;
  isCompact?: boolean;

  // Actions (Slots for flexibility)
  actions?: {
    wishlist?: ReactNode;
    quickView?: ReactNode;
    addToCart?: ReactNode;
    overlay?: ReactNode;
  };

  className?: string;
  onMouseEnter?: () => void;
}
```

### Composition Pattern (Slots)

**Evidence - Slot Pattern cho flexible actions:**

```tsx
// features/products/components/product-card-base.tsx:29-35
actions?: {
  wishlist?: ReactNode;
  quickView?: ReactNode;
  addToCart?: ReactNode;
  overlay?: ReactNode;
};

// Usage - Render slots
{actions?.wishlist && (
  <div className="absolute z-20 transition-all duration-500">
    {actions.wishlist}
  </div>
)}
```

---

## 2. Styling & Design System

### Tailwind CSS v4 + CSS Variables

**Evidence - `app/globals.css` (694 lines):**

| Token Category | Pattern                  | Example                                      |
| -------------- | ------------------------ | -------------------------------------------- |
| Colors         | OKLCH color space        | `oklch(0.985 0.003 90)`                      |
| Theme          | Quiet Luxury / Editorial | `--accent: oklch(0.82 0.055 85)` (Champagne) |
| Dark Mode      | `.dark` class toggle     | Full dark palette defined                    |
| Border Radius  | CSS variables            | `--radius: 0.75rem`                          |

### Design Tokens (Light Mode)

```css
/* app/globals.css:119-189 - Quiet Luxury Palette */
:root {
  /* Background: Bone White - Ultra-clean, gallery-like */
  --background: oklch(0.985 0.003 90);

  /* Primary: Obsidian - Timeless, bold */
  --primary: oklch(0.15 0.01 75);

  /* Accent: Soft Champagne - Subtle warmth, luxury whisper */
  --accent: oklch(0.82 0.055 85);

  /* Semantic Colors */
  --destructive: oklch(0.55 0.14 15); /* Muted Rose */
  --success: oklch(0.55 0.08 150); /* Sage */
  --info: oklch(0.55 0.08 240); /* Steel Blue */
  --warning: oklch(0.75 0.1 80); /* Warm Sand */
}
```

### Custom Utility Classes

| Class                      | Purpose                           | Evidence              |
| -------------------------- | --------------------------------- | --------------------- |
| `.glass`                   | Glassmorphism effect              | `globals.css:299-301` |
| `.glass-luxury`            | Premium glass with champagne tint | `globals.css:445-465` |
| `.glass-card`              | Card glassmorphism                | `globals.css:303-305` |
| `.text-gradient-champagne` | Shimmer text gradient             | `globals.css:468-480` |
| `.hover-lift`              | Subtle lift on hover              | `globals.css:513-520` |
| `.bento-cell`              | Bento grid cell styling           | `globals.css:483-510` |
| `.btn-quiet-luxury`        | Premium button                    | `globals.css:551-567` |

**Evidence - Glassmorphism:**

```css
/* app/globals.css:299-301 */
.glass {
  @apply bg-white/60 dark:bg-white/5 backdrop-blur-xl 
         border border-white/20 dark:border-white/10 shadow-lg;
}

/* Premium version with champagne tint */
.glass-luxury {
  background: linear-gradient(
    135deg,
    oklch(0.98 0.02 85 / 0.7) 0%,
    oklch(0.99 0.01 90 / 0.5) 100%
  );
  backdrop-filter: blur(24px) saturate(1.2);
  border: 1px solid oklch(0.88 0.045 85 / 0.3);
}
```

### Hover/Active/Focus States

**Pattern: Transition + Transform + Shadow**

```tsx
// features/products/components/product-card-base.tsx:96-115
<m.div
  className={cn(
    "group relative bg-white dark:bg-card rounded-3xl overflow-hidden",
    "hover:shadow-xl hover:shadow-accent/5 dark:hover:shadow-accent/10",
    "hover:border-accent/30 dark:hover:border-accent/20",
    className
  )}
  whileHover={!isCompact ? { y: -8 } : {}}
  transition={{
    type: "spring",
    stiffness: 400,
    damping: 30,
  }}
>
```

### Animation Patterns

| Type           | Implementation        | Evidence                         |
| -------------- | --------------------- | -------------------------------- |
| Framer Motion  | `m.div`, `whileHover` | Imported from `@/lib/animations` |
| CSS Keyframes  | `@keyframes shimmer`  | `globals.css:107-117`            |
| Spring Physics | `type: "spring"`      | `stiffness: 400, damping: 30`    |

---

## 3. Interactions & States

### Local State Pattern: `useState` (chủ yếu)

```tsx
// Example pattern từ features/products/components/product-card.tsx
const [isInWishlist, setIsInWishlist] = useState(false);
const [isLoading, setIsLoading] = useState(false);
```

### Loading State Pattern: Skeleton + Spinner

**Evidence - Shimmer Skeleton:**

```css
/* app/globals.css:107-116 */
@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}
--animate-shimmer: shimmer 1.5s ease-in-out infinite;
```

**Evidence - Button Loading:**

```tsx
// Common pattern
<Button disabled={isLoading}>
  {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit"}
</Button>
```

### Empty State Component

```tsx
// components/shared/shop-empty-state.tsx
export { ShopEmptyState } from "./shop-empty-state";
```

---

## 4. Accessibility (A11y) & Semantic HTML

### Radix UI Primitives

| Component     | Usage            | Evidence                        |
| ------------- | ---------------- | ------------------------------- |
| Dialog        | Modal dialogs    | `@radix-ui/react-dialog`        |
| Alert Dialog  | Confirmations    | `@radix-ui/react-alert-dialog`  |
| Dropdown Menu | Navigation menus | `@radix-ui/react-dropdown-menu` |
| Tabs          | Tab interfaces   | `@radix-ui/react-tabs`          |
| Toast         | Notifications    | `@radix-ui/react-toast`         |

### Semantic HTML

**Evidence - Limited semantic tags found:**

```tsx
// Pattern: Mostly divs with ARIA when needed
<div className="flex flex-col gap-4">
  <Link href={...} className="block">
    <h3 className="font-bold">{name}</h3>
  </Link>
</div>
```

**[CẦN CẢI THIỆN]**: Cân nhắc dùng `<article>`, `<section>`, `<main>` nhiều hơn.

---

## 5. Design Patterns UI

### className Merging với `cn()`

**Evidence - Mọi component dùng pattern này:**

```tsx
// lib/utils.ts (sử dụng clsx + tailwind-merge)
import { cn } from "@/lib/utils";

<div className={cn(
  "base-classes",
  isActive && "active-classes",
  className  // Allow override from props
)}>
```

### Conditional Rendering Pattern

| Pattern       | Usage          | Evidence                             |
| ------------- | -------------- | ------------------------------------ |
| `&&` operator | ✅ Chủ yếu     | `{isNew && <Badge />}`               |
| Ternary       | ✅ Cho toggle  | `{isCompact ? "sm" : "lg"}`          |
| Early return  | ✅ Cho loading | `if (isLoading) return <Skeleton />` |

**Evidence:**

```tsx
// features/products/components/product-card-base.tsx:141-178
{
  isNew && (
    <span className="bg-accent/90 text-accent-foreground...">{t("new")}</span>
  );
}

{
  !isNew && isHot && <span className="bg-primary/90...">{t("hot")}</span>;
}

{
  !isNew && !isHot && isSale && discountPercentage > 0 && (
    <span className="bg-destructive/90...">-{discountPercentage}%</span>
  );
}
```

### Wrapper/Layout Components

```tsx
// Pattern: Barrel export từ components/shared/index.ts
export { GlassCard } from "./glass-card";
export { BackgroundBlob } from "./background-blob";
export { StickyHeader } from "./sticky-header";
```

---

## 6. Image Optimization

### OptimizedImage Component

**Evidence - `components/shared/optimized-image.tsx`:**

```tsx
// Usage pattern
<OptimizedImage
  src={imageUrl || "/images/placeholders/product-placeholder.jpg"}
  alt={name}
  fill
  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
  containerClassName="w-full h-full"
  className="object-cover transition-transform duration-1000 
             ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-110"
  showShimmer={true}
/>
```

**Key patterns:**

- Always specify `sizes` for responsive
- Use `fill` for aspect-ratio containers
- `showShimmer` for loading state
- Custom easing for hover zoom effects

---

## 7. Typography

### Fonts (CSS Variables)

```css
/* app/globals.css:31-33 */
--font-sans: var(--font-outfit), system-ui, sans-serif;
--font-body: var(--font-inter), system-ui, sans-serif;
--font-serif: var(--font-playfair), serif;
```

### Editorial Typography Classes

```css
/* app/globals.css:538-548 */
.font-editorial {
  font-family: var(--font-serif);
  letter-spacing: -0.02em;
  font-weight: 400;
}

.font-editorial-bold {
  font-family: var(--font-serif);
  letter-spacing: -0.03em;
  font-weight: 600;
}
```
