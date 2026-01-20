# Admin UI Component Library - Design System

> [!IMPORTANT]
> Đây là tài liệu ghi nhớ phong cách UI chuẩn cho Admin Dashboard. Mọi trang admin mới PHẢI tuân theo design system này.

## Reference File

- **Path**: `web/features/admin/components/ui/admin-page-components.tsx`

## Core Components

### 1. AdminPageHeader

Page header với icon, title, subtitle, stats badges và actions.

```tsx
<AdminPageHeader
  title="Page Title"
  subtitle="Optional description"
  icon={<IconComponent />}
  variant="emerald" // color variant
  layout="default" // default | luxury | minimalist | glass
  stats={[{ label: "Total", value: 100, variant: "success" }]}
  actions={<Button>Action</Button>}
/>
```

### 2. AdminTableWrapper

Wrapper cho data tables với header, loading state.

```tsx
<AdminTableWrapper
  title="Table Title"
  description="Description"
  headerActions={<Button>Add</Button>}
  isLoading={false}
>
  <DataTable ... />
</AdminTableWrapper>
```

### 3. AdminStatsCard

Stat cards với trend indicator.

```tsx
<AdminStatsCard
  title="Revenue"
  value="$12,345"
  icon={DollarSign}
  variant="emerald"
  trend={{ value: 12, isPositive: true }}
/>
```

### 4. AdminEmptyState

Empty state với icon, title, description và action.

```tsx
<AdminEmptyState
  icon={Package}
  title="No items"
  description="Add your first item"
  action={<Button>Add Item</Button>}
  variant="default" // default | minimal
/>
```

### 5. AdminActionBadge

Status/action badges.

```tsx
<AdminActionBadge label="Active" variant="success" />
```

## Color Variants

| Variant | Use Case            |
| ------- | ------------------- |
| default | Neutral, generic    |
| success | Positive, completed |
| warning | Attention needed    |
| danger  | Error, critical     |
| info    | Informational       |
| aurora  | Premium, special    |
| emerald | Money, growth       |
| sky     | Info, links         |
| violet  | Creative, AI        |
| rose    | Love, favorites     |
| amber   | Pending, warning    |
| indigo  | Analytics           |
| teal    | Health, wellness    |
| orange  | Energy, alerts      |
| blue    | Trust, corporate    |
| cyan    | Tech, modern        |
| slate   | Muted, disabled     |

## Design Tokens

### Glass Effect

```css
.glass-premium {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}
```

### Border Radius

- Cards: `rounded-2xl` (1rem) to `rounded-3xl` (1.5rem)
- Buttons: `rounded-xl` to `rounded-2xl`
- Badges: `rounded-full`

### Typography

- Headings: `font-black tracking-tight`
- Labels: `text-[10px] font-black uppercase tracking-[0.2em]`
- Body: `text-sm font-medium`

### Animations

- Entry: `animate-in fade-in slide-in-from-*`
- Hover: Framer Motion `whileHover={{ y: -5, scale: 1.02 }}`
- Loading: Custom spinner with `animate-spin`

## Usage Guidelines

1. **Consistency**: Luôn import từ `@/features/admin/components/ui/admin-page-components`
2. **Variants**: Chọn variant phù hợp với context (emerald cho finance, violet cho AI...)
3. **Layout**: Dùng `layout="default"` cho hầu hết pages, `luxury` cho dashboards
4. **Animations**: Framer Motion `m` component cho interactive elements
