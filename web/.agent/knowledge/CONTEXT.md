# Project Context - Ecommerce Web

> **Last Updated**: 2026-01-23
> **Status**: Active Development

---

## 1. Current State

### Architecture

- **Pattern**: Feature-based modular architecture
- **Framework**: Next.js 16 with App Router
- **Styling**: Tailwind CSS v4 + Shadcn/ui
- **State**: Zustand + SWR for data fetching

### Key Features Status

| Feature  | Standard Structure | Status                   |
| -------- | ------------------ | ------------------------ |
| Auth     | ✅ Complete        | Login, Register, Session |
| Products | ✅ Complete        | Listing, Detail, Search  |
| Cart     | ✅ Complete        | Add, Update, Checkout    |
| Admin    | 🔄 In Progress     | Dashboard, CRUD          |
| Profile  | ✅ Complete        | Orders, Addresses        |

---

## 2. Feature Module Standard

Each feature follows this structure:

```
features/<feature-name>/
├── components/           # UI components
├── hooks/                # Custom hooks (data fetching)
├── actions/              # Server Actions (next-safe-action)
├── schemas/              # Zod validation schemas
├── types/                # TypeScript types
├── utils/                # Feature-specific utilities
└── index.ts              # Public exports
```

---

## 3. Key Libraries

| Library            | Purpose                  |
| ------------------ | ------------------------ |
| `next-safe-action` | Type-safe server actions |
| `react-hook-form`  | Form management          |
| `zod`              | Validation               |
| `zustand`          | Global state             |
| `swr`              | Data fetching            |
| `nuqs`             | URL state                |
| `sonner`           | Toast notifications      |
| `framer-motion`    | Animations               |

---

## 4. Architectural Decisions Record (ADR)

### ADR-001: Feature-based Module Structure

- **Decision**: Organize code by feature, not by type
- **Rationale**: Better colocation, easier navigation
- **Trade-offs**: Some duplication of patterns

### ADR-002: Server Actions with next-safe-action

- **Decision**: Use `protectedActionClient` for all mutations
- **Rationale**: Type-safety, auth verification, Zod validation
- **Trade-offs**: More boilerplate than raw server actions

### ADR-003: Zod-only Validation

- **Decision**: Use Zod exclusively (no class-validator)
- **Rationale**: Shared with API, type inference
- **Trade-offs**: None significant

---

## 5. Changelog

### 2026-01-23

**Documentation:**

- Created CONTEXT.md for Web project
- Created feature-structure.md guidelines
- Created architecture.md documentation

**Skills:**

- Added `web-design-guidelines` skill from Vercel
- Comprehensive UI/UX review guidelines
- Accessibility checklist (focus states, ARIA, etc.)

**Accessibility Improvements (per web-design-guidelines):**

- Added `prefers-reduced-motion` support in globals.css
- Added `color-scheme: dark` for native inputs in dark mode
- Added `touch-action: manipulation` for better mobile UX
- Added `-webkit-tap-highlight-color: transparent`
- Added `overflow-x: hidden` to prevent mobile horizontal scroll

---

## 6. Design System

### Color Palette (Quiet Luxury Theme)

- **Primary**: Deep charcoal (#1a1a2e)
- **Accent**: Warm gold (#c4a35a)
- **Background**: Off-white (#faf9f7)
- **Text**: Rich black (#0d0d0d)

### Typography

- **Headings**: Playfair Display (serif)
- **Body**: Inter (sans-serif)

### Components

- Shadcn/ui base components
- Custom premium variants (glassmorphism, gradients)

---

## 7. Performance Targets

| Metric     | Target  | Current |
| ---------- | ------- | ------- |
| LCP        | < 2.5s  | TBD     |
| FID        | < 100ms | TBD     |
| CLS        | < 0.1   | TBD     |
| Lighthouse | > 90    | TBD     |

---

## 8. Next Steps

1. Apply feature structure to remaining features
2. Add E2E tests for critical flows
3. Performance optimization audit
4. SEO improvements
