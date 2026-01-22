# Thông số Thiết kế UI/UX
## Nền tảng E-commerce Multi-tenant

---

### Thông tin tài liệu

**Phiên bản**: 1.0  
**Ngày**: 22 tháng 1, 2026  
**Tác giả**: Đội ngũ Thiết kế  
**Trạng thái**: Bản nháp  

---

### Triết lý Thiết kế

#### Nguyên tắc Cốt lõi

1. **Thiết kế Lấy người dùng làm trung tâm**: Mọi quyết định ưu tiên nhu cầu người dùng và mục tiêu kinh doanh
2. **Tính nhất quán**: Trải nghiệm thống nhất trên mọi điểm tiếp xúc
3. **Khả năng truy cập**: Thiết kế bao gồm cho tất cả người dùng
4. **Hiệu suất**: Tương tác nhanh, phản hồi nhanh
5. **Khả năng mở rộng**: Hệ thống thiết kế phát triển cùng nền tảng

#### Mục tiêu Thiết kế

- **Tối ưu hóa Chuyển đổi**: Quy trình thanh toán tinh gọn
- **Xây dựng Tin cậy**: Vẻ ngoài chuyên nghiệp, đáng tin cậy
- **Linh hoạt Thương hiệu**: Tùy chỉnh cho các tenant khác nhau
- **Mobile First**: Tối ưu cho trải nghiệm di động
- **International Ready**: Multi-language and currency support

---

### Design System

#### Color Palette

##### Primary Colors (Monochrome System)

```css
/* Base Colors */
--color-black: #000000;
--color-white: #ffffff;
--color-gray-50: #fafafa;
--color-gray-100: #f5f5f5;
--color-gray-200: #e5e5e5;
--color-gray-300: #d4d4d4;
--color-gray-400: #a3a3a3;
--color-gray-500: #737373;
--color-gray-600: #525252;
--color-gray-700: #404040;
--color-gray-800: #262626;
--color-gray-900: #171717;

/* Semantic Colors */
--color-primary: var(--color-gray-900);
--color-primary-foreground: var(--color-white);
--color-secondary: var(--color-gray-100);
--color-secondary-foreground: var(--color-gray-900);
--color-muted: var(--color-gray-100);
--color-muted-foreground: var(--color-gray-500);
--color-accent: var(--color-gray-900);
--color-accent-foreground: var(--color-white);

/* Status Colors */
--color-success: #22c55e;
--color-success-foreground: var(--color-white);
--color-warning: #f59e0b;
--color-warning-foreground: var(--color-white);
--color-error: #ef4444;
--color-error-foreground: var(--color-white);
--color-info: #3b82f6;
--color-info-foreground: var(--color-white);
```

##### Octal Domain Color System (Admin Dashboard)

```css
/* Domain Coding for Admin Navigation */
--color-emerald: #10b981;  /* Analytics */
--color-sky: #0ea5e9;      /* Orders */
--color-violet: #8b5cf6;   /* Customers */
--color-rose: #f43f5e;     /* Marketing */
--color-amber: #f59e0b;    /* Settings */
--color-indigo: #6366f1;   /* Security */
--color-teal: #14b8a6;     /* Inventory */
--color-orange: #f97316;  /* Reports */
```

#### Typography

##### Font Stack

```css
/* Primary Font Stack */
--font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', Consolas, monospace;
--font-serif: 'Crimson Text', Georgia, serif;

/* Font Sizes */
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 1.875rem;  /* 30px */
--text-4xl: 2.25rem;   /* 36px */
--text-5xl: 3rem;      /* 48px */

/* Font Weights */
--font-light: 300;
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
--font-extrabold: 800;

/* Line Heights */
--leading-tight: 1.25;
--leading-normal: 1.5;
--leading-relaxed: 1.75;
```

##### Typography Scale

| Element | Size | Weight | Usage |
|---------|------|--------|-------|
| H1 | 2.25rem (36px) | Bold | Page titles |
| H2 | 1.875rem (30px) | Bold | Section headers |
| H3 | 1.5rem (24px) | Semibold | Subsection headers |
| H4 | 1.25rem (20px) | Semibold | Component headers |
| Body | 1rem (16px) | Normal | Main content |
| Small | 0.875rem (14px) | Normal | Secondary info |
| Caption | 0.75rem (12px) | Normal | Labels, captions |

#### Spacing System

```css
/* Spacing Scale (8px base unit) */
--space-0: 0;
--space-1: 0.25rem;  /* 4px */
--space-2: 0.5rem;   /* 8px */
--space-3: 0.75rem;  /* 12px */
--space-4: 1rem;     /* 16px */
--space-5: 1.25rem;  /* 20px */
--space-6: 1.5rem;   /* 24px */
--space-8: 2rem;     /* 32px */
--space-10: 2.5rem;  /* 40px */
--space-12: 3rem;    /* 48px */
--space-16: 4rem;    /* 64px */
--space-20: 5rem;    /* 80px */
--space-24: 6rem;    /* 96px */
```

#### Border Radius

```css
--radius-none: 0;
--radius-sm: 0.125rem;   /* 2px */
--radius-base: 0.25rem;  /* 4px */
--radius-md: 0.375rem;    /* 6px */
--radius-lg: 0.5rem;      /* 8px */
--radius-xl: 0.75rem;     /* 12px */
--radius-2xl: 1rem;       /* 16px */
--radius-full: 9999px;
```

#### Shadows

```css
--shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
--shadow-base: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
--shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
--shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
--shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
--shadow-2xl: 0 25px 50px -12px rgb(0 0 0 / 0.25);
```

---

### Component Library

#### Buttons

##### Primary Button

```css
.btn-primary {
  background-color: var(--color-primary);
  color: var(--color-primary-foreground);
  padding: var(--space-3) var(--space-6);
  border-radius: var(--radius-md);
  font-weight: var(--font-medium);
  font-size: var(--text-base);
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

.btn-primary:active {
  transform: translateY(0);
}
```

##### Button Variants

| Variant | Usage | Style |
|---------|-------|-------|
| Primary | Main actions | Solid background |
| Secondary | Alternative actions | Outline button |
| Ghost | Subtle actions | No background |
| Link | Navigation links | Text-only |
| Destructive | Delete actions | Red background |

##### Button Sizes

| Size | Padding | Font Size |
|------|---------|-----------|
| sm | 0.5rem 1rem | 0.875rem |
| md | 0.75rem 1.5rem | 1rem |
| lg | 1rem 2rem | 1.125rem |
| xl | 1.25rem 2.5rem | 1.25rem |

#### Form Elements

##### Input Fields

```css
.input {
  width: 100%;
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--color-gray-300);
  border-radius: var(--radius-md);
  font-size: var(--text-base);
  transition: all 0.2s ease;
}

.input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px rgb(0 0 0 / 0.1);
}

.input:invalid {
  border-color: var(--color-error);
}
```

##### Form Validation States

| State | Border Color | Helper Text |
|-------|--------------|-------------|
| Default | Gray 300 | None |
| Focus | Primary | None |
| Error | Error | Error message |
| Success | Success | Success message |
| Disabled | Gray 200 | None |

#### Cards

##### Product Card

```css
.product-card {
  background: var(--color-white);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
  transition: all 0.3s ease;
}

.product-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.product-card-image {
  width: 100%;
  height: 200px;
  object-fit: cover;
}

.product-card-content {
  padding: var(--space-4);
}

.product-card-title {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  margin-bottom: var(--space-2);
}

.product-card-price {
  font-size: var(--text-xl);
  font-weight: var(--font-bold);
  color: var(--color-primary);
}
```

#### Navigation

##### Header Navigation

```css
.nav-header {
  background: var(--color-white);
  border-bottom: 1px solid var(--color-gray-200);
  padding: var(--space-4) 0;
  position: sticky;
  top: 0;
  z-index: 100;
}

.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--space-4);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.nav-logo {
  font-size: var(--text-2xl);
  font-weight: var(--font-bold);
  color: var(--color-primary);
  text-decoration: none;
}

.nav-menu {
  display: flex;
  gap: var(--space-6);
  list-style: none;
}

.nav-link {
  color: var(--color-gray-700);
  text-decoration: none;
  font-weight: var(--font-medium);
  transition: color 0.2s ease;
}

.nav-link:hover {
  color: var(--color-primary);
}
```

---

### Layout System

#### Grid System

```css
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 var(--space-4);
}

.grid {
  display: grid;
  gap: var(--space-6);
}

.grid-cols-1 { grid-template-columns: repeat(1, 1fr); }
.grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
.grid-cols-3 { grid-template-columns: repeat(3, 1fr); }
.grid-cols-4 { grid-template-columns: repeat(4, 1fr); }

/* Responsive Grid */
@media (max-width: 768px) {
  .grid-cols-2,
  .grid-cols-3,
  .grid-cols-4 {
    grid-template-columns: 1fr;
  }
}
```

#### Flexbox Utilities

```css
.flex { display: flex; }
.flex-col { flex-direction: column; }
.flex-wrap { flex-wrap: wrap; }

.justify-start { justify-content: flex-start; }
.justify-center { justify-content: center; }
.justify-end { justify-content: flex-end; }
.justify-between { justify-content: space-between; }

.items-start { align-items: flex-start; }
.items-center { align-items: center; }
.items-end { align-items: flex-end; }
.items-stretch { align-items: stretch; }
```

#### Responsive Breakpoints

```css
/* Breakpoints */
--breakpoint-sm: 640px;
--breakpoint-md: 768px;
--breakpoint-lg: 1024px;
--breakpoint-xl: 1280px;
--breakpoint-2xl: 1536px;

/* Media Queries */
@media (min-width: 640px) { /* sm */ }
@media (min-width: 768px) { /* md */ }
@media (min-width: 1024px) { /* lg */ }
@media (min-width: 1280px) { /* xl */ }
@media (min-width: 1536px) { /* 2xl */ }
```

---

### Page Layouts

#### Storefront Layout

```
┌─────────────────────────────────────────────────────────────────┐
│                        Header                                   │
│  Logo | Navigation | Search | Cart | User | Language          │
└─────────────────────┬───────────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────────┐
│                        Hero Section                            │
│              Banner | CTA | Featured Products                   │
└─────────────────────┬───────────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────────┐
│                     Main Content                               │
│  Categories | Featured Products | Promotions | Reviews          │
└─────────────────────┬───────────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────────┐
│                        Footer                                   │
│    Links | Social | Newsletter | Copyright | Payment          │
└─────────────────────────────────────────────────────────────────┘
```

#### Product Listing Layout

```
┌─────────────────────────────────────────────────────────────────┐
│                    Page Header                                 │
│           Breadcrumb | Title | Sort | View Options             │
└─────────────────────┬───────────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────────┐
│                    Filters Sidebar                             │
│  Categories | Price | Brand | Rating | Features | Reset          │
└─────────────────────┬───────────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────────┐
│                    Product Grid                                 │
│        Product Card | Product Card | Product Card              │
│        Product Card | Product Card | Product Card              │
└─────────────────────┬───────────────────────────────────────────┘
                      │
┌─────────────────────▼───────────────────────────────────────────┐
│                    Pagination                                  │
│           Previous | 1 2 3 ... 10 | Next                       │
└─────────────────────────────────────────────────────────────────┘
```

#### Admin Dashboard Layout

```
┌─────────────────────────────────────────────────────────────────┐
│                        Admin Header                            │
│  Logo | Search | Notifications | User | Settings               │
└─────────────────────┬───────────────────────────────────────────┘
                      │
┌───────────┬─────────▼─────────────────┬─────────────────────────┐
│            │                         │                         │
│  Sidebar   │      Main Content       │      Right Panel        │
│            │                         │                         │
│ • Dashboard│  ┌─────────────────┐    │  • Quick Actions        │
│ • Orders   │  │   Page Header   │    │  • Recent Activity      │
│ • Products │  │                 │    │  • System Status        │
│ • Customers│  │   Content Area  │    │  • Help & Support       │
│ • Marketing│  │                 │    │                         │
│ • Settings │  └─────────────────┘    │                         │
│            │                         │                         │
└───────────┴─────────────────────────┴─────────────────────────┘
```

---

### User Flow Diagrams

#### Customer Purchase Journey

```
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│  Home   │───▶│ Browse  │───▶│ Product │───▶│  Cart   │───▶│Checkout │
│  Page   │    │ Products│    │  Detail │    │  Review │    │ Process │
└─────────┘    └─────────┘    └─────────┘    └─────────┘    └─────────┘
       │              │              │              │              │
       ▼              ▼              ▼              ▼              ▼
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│ Search  │    │ Filter  │    │ Reviews │    │ Apply   │    │Payment  │
│ Results │    │ Results │    │ Gallery │    │ Promo   │    │Process  │
└─────────┘    └─────────┘    └─────────┘    └─────────┘    └─────────┘
```

#### Admin Order Management Flow

```
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│ Order   │───▶│ Order   │───▶│ Process │───▶│ Update  │───▶│ Notify  │
│ List    │    │ Detail  │    │ Payment │    │ Status  │    │Customer │
└─────────┘    └─────────┘    └─────────┘    └─────────┘    └─────────┘
       │              │              │              │              │
       ▼              ▼              ▼              ▼              ▼
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│ Filter  │    │ Customer│    │ Reserve │    │ Create  │    │ Track   │
│ Orders  │    │ History │    │ Stock   │    │ Shipment│    │ Package │
└─────────┘    └─────────┘    └─────────┘    └─────────┘    └─────────┘
```

---

### Responsive Design Specifications

#### Mobile Breakpoints

| Breakpoint | Width | Target Devices | Layout Changes |
|------------|-------|----------------|----------------|
| xs | < 640px | Phones | Single column, stacked navigation |
| sm | 640px+ | Large phones, small tablets | 2-column grid, horizontal nav |
| md | 768px+ | Tablets | 3-column grid, sidebar navigation |
| lg | 1024px+ | Laptops, desktops | Full layout, all features |
| xl | 1280px+ | Large desktops | Wider layouts, more content |

#### Mobile-First Considerations

1. **Touch Targets**: Minimum 44px tap targets
2. **Thumb Zone**: Navigation within easy reach
3. **Readable Text**: Minimum 16px font size
4. **Simplified Forms**: Reduce input fields
5. **Progressive Enhancement**: Add features for larger screens

#### Responsive Components

##### Navigation

```css
/* Mobile Navigation */
@media (max-width: 768px) {
  .nav-menu {
    position: fixed;
    top: 0;
    left: -100%;
    width: 80%;
    height: 100vh;
    background: var(--color-white);
    flex-direction: column;
    padding: var(--space-6);
    transition: left 0.3s ease;
    z-index: 1000;
  }
  
  .nav-menu.active {
    left: 0;
  }
  
  .nav-toggle {
    display: block;
  }
}

/* Desktop Navigation */
@media (min-width: 769px) {
  .nav-menu {
    position: static;
    width: auto;
    height: auto;
    flex-direction: row;
    padding: 0;
  }
  
  .nav-toggle {
    display: none;
  }
}
```

##### Product Grid

```css
.product-grid {
  display: grid;
  gap: var(--space-4);
  grid-template-columns: 1fr;
}

@media (min-width: 640px) {
  .product-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 768px) {
  .product-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (min-width: 1024px) {
  .product-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}
```

---

### Accessibility Guidelines

#### WCAG 2.1 AA Compliance

1. **Perceivable**
   - Color contrast: 4.5:1 for normal text, 3:1 for large text
   - Text alternatives for images
   - Captions for video content
   - Sufficient color usage without relying on color alone

2. **Operable**
   - Keyboard navigation support
   - Focus indicators visible
   - No time limits without controls
   - Motion reduction support

3. **Understandable**
   - Readable content with clear language
   - Input assistance and error identification
   - Consistent navigation and identification
   - Predictable functionality

4. **Robust**
   - Compatible with assistive technologies
   - Semantic HTML markup
   - ARIA labels and roles
   - Screen reader compatibility

#### Accessibility Implementation

##### Semantic HTML

```html
<!-- Proper heading structure -->
<main>
  <h1>Product Listing</h1>
  <section aria-label="Filters">
    <h2>Filter Products</h2>
    <!-- Filter content -->
  </section>
  <section aria-label="Products">
    <h2>Available Products</h2>
    <!-- Product grid -->
  </section>
</main>
```

##### ARIA Labels

```html
<button 
  aria-label="Add product to cart"
  aria-describedby="product-name product-price"
>
  Add to Cart
</button>

<div id="product-name">Wireless Headphones</div>
<div id="product-price">$99.99</div>
```

##### Focus Management

```css
/* Focus indicators */
.focusable:focus {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}

/* Skip to content link */
.skip-to-content {
  position: absolute;
  top: -40px;
  left: 6px;
  background: var(--color-primary);
  color: var(--color-white);
  padding: 8px;
  text-decoration: none;
  z-index: 1000;
}

.skip-to-content:focus {
  top: 6px;
}
```

---

### Animation and Micro-interactions

#### Animation Principles

1. **Purposeful**: Animations should enhance UX, not distract
2. **Performant**: Use transform and opacity for smooth animations
3. **Respectful**: Honor user's motion preferences
4. **Consistent**: Maintain consistent timing and easing

#### Timing Functions

```css
/* Easing functions */
--ease-in: cubic-bezier(0.4, 0, 1, 1);
--ease-out: cubic-bezier(0, 0, 0.2, 1);
--ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);

/* Durations */
--duration-fast: 150ms;
--duration-normal: 300ms;
--duration-slow: 500ms;
```

#### Common Animations

##### Button Hover

```css
.btn {
  transition: all var(--duration-normal) var(--ease-out);
}

.btn:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}
```

##### Card Reveal

```css
.card {
  opacity: 0;
  transform: translateY(20px);
  transition: all var(--duration-normal) var(--ease-out);
}

.card.visible {
  opacity: 1;
  transform: translateY(0);
}
```

##### Loading States

```css
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.loading-spinner {
  animation: spin 1s linear infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.loading-skeleton {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
```

---

### Performance Guidelines

#### Image Optimization

1. **Format Selection**: WebP for modern browsers, JPEG fallback
2. **Responsive Images**: srcset for different screen sizes
3. **Lazy Loading**: Intersection Observer for below-fold images
4. **Compression**: Optimize file size without quality loss

```html
<picture>
  <source srcset="image.webp" type="image/webp">
  <source srcset="image.jpg" type="image/jpeg">
  <img 
    src="image.jpg" 
    alt="Product image"
    loading="lazy"
    width="400"
    height="300"
  >
</picture>
```

#### CSS Performance

1. **Critical CSS**: Inline above-the-fold styles
2. **CSS Purging**: Remove unused styles
3. **Efficient Selectors**: Avoid complex selectors
4. **CSS Containment**: Optimize rendering

#### JavaScript Performance

1. **Code Splitting**: Load only necessary code
2. **Tree Shaking**: Remove unused code
3. **Image Lazy Loading**: Intersection Observer
4. **Debouncing**: Optimize event handlers

---

### Internationalization Support

#### Multi-Language Design

1. **Text Expansion**: Design for 30% longer text
2. **RTL Support**: Right-to-left language layouts
3. **Font Considerations**: Web fonts for different scripts
4. **Date/Time Formats**: Localized formatting

#### Currency Display

```css
.currency {
  font-variant-numeric: tabular-nums;
}

.currency-symbol {
  margin-right: 0.25em;
}
```

#### Language Switcher

```html
<div class="language-switcher">
  <button aria-label="Select language">
    <span class="flag">🇺🇸</span>
    <span class="code">EN</span>
    <svg class="chevron" aria-hidden="true">
      <!-- chevron icon -->
    </svg>
  </button>
</div>
```

---

### Brand Customization

#### Tenant Branding System

1. **Color Overrides**: Primary and accent colors
2. **Logo Integration**: Custom logo placement
3. **Typography**: Custom font selection
4. **Layout Variations**: Different layout options

#### CSS Custom Properties for Branding

```css
:root {
  /* Tenant-specific colors */
  --tenant-primary: #000000;
  --tenant-secondary: #ffffff;
  --tenant-accent: #3b82f6;
  
  /* Tenant fonts */
  --tenant-font-primary: 'Inter', sans-serif;
  --tenant-font-secondary: 'Georgia', serif;
  
  /* Tenant spacing */
  --tenant-spacing-unit: 1rem;
}
```

#### Theme Variants

```css
.theme-light {
  --color-background: var(--color-white);
  --color-foreground: var(--color-gray-900);
}

.theme-dark {
  --color-background: var(--color-gray-900);
  --color-foreground: var(--color-white);
}

.theme-high-contrast {
  --color-background: var(--color-white);
  --color-foreground: var(--color-black);
  --border-width: 2px;
}
```

---

### Design Tokens Management

#### Token Structure

```json
{
  "color": {
    "primary": {
      "50": "#fafafa",
      "500": "#737373",
      "900": "#171717"
    },
    "semantic": {
      "success": "#22c55e",
      "warning": "#f59e0b",
      "error": "#ef4444",
      "info": "#3b82f6"
    }
  },
  "typography": {
    "fontFamily": {
      "sans": ["Inter", "sans-serif"],
      "mono": ["JetBrains Mono", "monospace"]
    },
    "fontSize": {
      "xs": "0.75rem",
      "sm": "0.875rem",
      "base": "1rem",
      "lg": "1.125rem"
    }
  },
  "spacing": {
    "0": "0",
    "1": "0.25rem",
    "2": "0.5rem",
    "4": "1rem",
    "8": "2rem"
  }
}
```

#### Token Usage in Components

```css
.button-primary {
  background-color: var(--color-primary-500);
  color: var(--color-primary-50);
  padding: var(--spacing-2) var(--spacing-4);
  font-family: var(--fontFamily-sans);
  font-size: var(--fontSize-base);
}
```

---

### Design Review Process

#### Review Checklist

1. **Visual Design**
   - [ ] Consistent with design system
   - [ ] Proper hierarchy and contrast
   - [ ] Appropriate use of color and typography
   - [ ] Responsive behavior

2. **Usability**
   - [ ] Clear navigation and wayfinding
   - [ ] Intuitive interactions
   - [ ] Error prevention and recovery
   - [ ] Accessibility compliance

3. **Performance**
   - [ ] Optimized images and assets
   - [ ] Efficient CSS and JavaScript
   - [ ] Fast loading times
   - [ ] Smooth animations

4. **Brand Consistency**
   - [ ] Follows brand guidelines
   - [ ] Appropriate tone and voice
   - [ ] Consistent messaging
   - [ ] Professional appearance

#### Approval Workflow

1. **Design Review**: Visual and UX review
2. **Stakeholder Approval**: Business requirements check
3. **Technical Review**: Implementation feasibility
4. **User Testing**: Validation with real users
5. **Final Sign-off**: Ready for development

---

### Approval

**Design Lead**: ___________________  
**Date**: ___________________  
**Signature**: ___________________  

**UX Lead**: ___________________  
**Date**: ___________________  
**Signature**: ___________________  

**Product Manager**: ___________________  
**Date**: ___________________  
**Signature**: ___________________
