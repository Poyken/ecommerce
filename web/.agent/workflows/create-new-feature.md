---
description: Quy trình tạo feature mới theo cấu trúc chuẩn dự án
---

# Tạo Feature Mới

> Dựa trên phân tích module `features/cart/` và `features/notifications/`.

## Cấu trúc Feature Mẫu

```
features/[domain]/
├── actions.ts           # Server actions (mutations)
├── components/          # UI components
│   ├── [component-name].tsx
│   └── index.ts         # Barrel export (optional)
├── hooks/               # Custom React hooks
│   └── use-[hook-name].ts
├── store/               # Zustand store
│   └── [domain].store.ts
├── providers/           # React context providers (optional)
└── services/            # API service classes (optional)
```

**Evidence:**

- `features/cart/` có: actions.ts, components/ (7 files), hooks/, store/
- `features/notifications/` có: components/, store/, actions.ts

---

## Step 1: Scaffolding

```bash
# Tạo cấu trúc thư mục
mkdir -p features/[domain]/{components,hooks,store}

# Tạo file actions
touch features/[domain]/actions.ts
```

---

## Step 2: Định nghĩa Types

```typescript
// types/models.ts (thêm vào file tập trung)
export interface [DomainEntity] {
  id: string;
  // ... properties
  createdAt: string;
  updatedAt: string;
}
```

**Pattern từ dự án - `types/models.ts` (800+ lines):**

- Tất cả domain models tập trung
- Dùng `interface` (không `type`)
- Có relations (e.g., `user?: User`)

---

## Step 3: Tạo Zustand Store

```typescript
// features/[domain]/store/[domain].store.ts

import { create } from "zustand";

interface [Domain]State {
  items: [DomainEntity][];
  isLoading: boolean;

  setItems: (items: [DomainEntity][]) => void;
  setIsLoading: (isLoading: boolean) => void;
  addItem: (item: [DomainEntity]) => void;
  refresh: () => Promise<void>;
}

export const use[Domain]Store = create<[Domain]State>((set) => ({
  items: [],
  isLoading: false,

  setItems: (items) => set({ items }),
  setIsLoading: (isLoading) => set({ isLoading }),

  addItem: (item) => set((state) => ({
    items: [item, ...state.items].slice(0, 10), // Limit memory
  })),

  refresh: async () => {
    set({ isLoading: true });
    try {
      const result = await get[Domain]Action();
      if (result.success && result.data) {
        set({ items: result.data });
      }
    } finally {
      set({ isLoading: false });
    }
  },
}));
```

**Evidence từ `cart.store.ts` và `notification.store.ts`.**

---

## Step 4: Tạo Server Actions

```typescript
// features/[domain]/actions.ts
"use server";

import { actionClient } from "@/lib/safe-action";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { http } from "@/lib/http";

const schema = z.object({
  // validation
});

export const create[Domain]Action = actionClient
  .schema(schema)
  .action(async ({ parsedInput }) => {
    try {
      const response = await http.post("/[endpoint]", parsedInput);
      revalidatePath("/[path]");
      return { success: true, data: response.data };
    } catch (error: unknown) {
      return {
        success: false,
        error: (error as Error).message || "Failed"
      };
    }
  });
```

**Evidence từ `features/auth/actions.ts`.**

---

## Step 5: Tạo Component

```tsx
// features/[domain]/components/[domain]-card.tsx
"use client";

import { cn } from "@/lib/utils";

export interface [Domain]CardProps {
  item: [DomainEntity];
  className?: string;
}

/**
 * =====================================================================
 * [DOMAIN] CARD - [Mô tả ngắn]
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 * 1. [Pattern đang dùng]
 */
export function [Domain]Card({ item, className }: [Domain]CardProps) {
  return (
    <div className={cn(
      "group relative bg-white dark:bg-card rounded-3xl overflow-hidden",
      "border border-neutral-100 dark:border-white/5",
      "hover:shadow-xl hover:shadow-accent/5",
      className
    )}>
      {/* Content */}
    </div>
  );
}
```

---

## Step 6: Tạo Route Page

```typescript
// app/[locale]/[domain]/page.tsx
import { [Domain]List } from "@/features/[domain]/components";

export default async function [Domain]Page() {
  return (
    <main className="container py-8">
      <[Domain]List />
    </main>
  );
}
```

---

## Step 7: Integration Points

### 7.1 Nếu cần Navigation

Cập nhật trong `features/layout/components/`:

- `header-nav.tsx` - Desktop nav
- `mobile-nav.tsx` - Mobile nav
- `footer.tsx` - Footer links

### 7.2 Nếu cần Admin

Thêm vào `features/admin/components/` và route `app/[locale]/admin/[domain]/`.

---

// turbo

## Step 8: Verification

```bash
# Type check
npx tsc --noEmit

# Lint
npm run lint

# Test (nếu có)
npm run test:run
```

---

## Checklist

- [ ] Folder structure đúng
- [ ] Types trong `types/models.ts`
- [ ] Store với Zustand pattern
- [ ] Actions với error handling
- [ ] Components với JSDoc
- [ ] Route page tạo
- [ ] Navigation cập nhật (nếu cần)
- [ ] Lint và type check pass
