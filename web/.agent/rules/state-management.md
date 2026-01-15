# Quy tắc Quản lý State - Ecommerce Web

> ⚠️ Các quy tắc này được rút ra từ code hiện có, KHÔNG phải lý thuyết.

---

## 1. Global State Strategy

### Library: Zustand (KHÔNG dùng Redux)

**Evidence - `package.json:74`:**

```json
"zustand": "^5.0.9"
```

### Store Pattern

| Pattern    | Evidence                                    |
| ---------- | ------------------------------------------- |
| Naming     | `use[Domain]Store` (hook pattern)           |
| Location   | `features/[domain]/store/[domain].store.ts` |
| Structure  | Interface + create function                 |
| Middleware | Không dùng persist mặc định                 |

**Evidence - `features/cart/store/cart.store.ts`:**

```typescript
import { create } from "zustand";

interface CartState {
  count: number;
  isFetching: boolean;
  refreshCart: () => Promise<void>;
  updateCount: (newCount: number) => void;
  increment: (amount?: number) => void;
  decrement: (amount?: number) => void;
  setFetching: (isFetching: boolean) => void;
}

export const useCartStore = create<CartState>((set) => ({
  count: 0,
  isFetching: false,

  setFetching: (isFetching) => set({ isFetching }),
  updateCount: (newCount) => set({ count: newCount }),
  increment: (amount = 1) => set((state) => ({ count: state.count + amount })),
  decrement: (amount = 1) =>
    set((state) => ({
      count: Math.max(0, state.count - amount),
    })),

  refreshCart: async () => {
    set({ isFetching: true });
    try {
      const result = await getCartCountAction();
      if (result.success && result.data) {
        set({ count: result.data.totalItems });
      }
    } finally {
      set({ isFetching: false });
    }
  },
}));
```

### Stores Hiện có

| Store                  | File                                                 | Purpose                              |
| ---------------------- | ---------------------------------------------------- | ------------------------------------ |
| `useCartStore`         | `features/cart/store/cart.store.ts`                  | Quản lý số lượng giỏ hàng            |
| `useNotificationStore` | `features/notifications/store/notification.store.ts` | Quản lý notifications + unread count |

---

## 2. Server State (Remote Data)

### Library: SWR

**Evidence - `package.json:68`:**

```json
"swr": "^2.3.8"
```

### Custom Hooks Pattern

| Pattern  | Evidence                                |
| -------- | --------------------------------------- |
| Naming   | `use[Resource]` hoặc `use[Action]`      |
| Location | `features/[domain]/hooks/use-[name].ts` |

**Evidence - Custom hook pattern:**

```typescript
// Không có cấu hình SWR global rõ ràng
// Sử dụng trong components với default configs
import useSWR from "swr";

const { data, error, isLoading, mutate } = useSWR(
  `/api/endpoint/${id}`,
  fetcher
);
```

### Caching Strategy

**[KHÔNG TÌM THẤY CẤU HÌNH TẬP TRUNG]**

- Không thấy file `swr-config.ts` hay global provider
- Mỗi hook tự define caching behavior

---

## 3. Optimistic Updates Pattern

### Evidence - `features/notifications/store/notification.store.ts:84-99`:

```typescript
markAsRead: async (id) => {
  // Optimistic update - UI cập nhật NGAY LẬP TỨC
  set((state) => ({
    notifications: state.notifications.map((n) =>
      n.id === id ? { ...n, isRead: true } : n
    ),
    unreadCount: Math.max(0, state.unreadCount - 1),
  }));

  try {
    // Call API sau - không chờ kết quả
    await markAsReadServerAction(id);
  } catch (error) {
    console.error("Failed to mark notification as read", error);
    // Could revert here but typically server action succeeds
  }
},
```

### Pattern Summary:

1. **Update UI trước** (optimistic)
2. **Call API sau** (fire and forget cho actions đơn giản)
3. **Không rollback** - tin tưởng API sẽ thành công

---

## 4. Persistence & Sync

### LocalStorage Pattern (Guest Cart)

**Evidence - Hybrid Guest/Auth trong `cart.store.ts`:**

```typescript
// Logic will be handled by the caller or the Initializer
// which has context
// Store chỉ lưu `count`, việc quyết định lấy count từ
// Database hay LocalStorage (Guest) được điều phối bởi
// `CartInitializer`.
```

### Initializer Pattern

**Evidence - `features/cart/components/cart-initializer.tsx`:**

```typescript
// CartInitializer component
// - Kiểm tra user auth status
// - Nếu Guest: đọc từ localStorage
// - Nếu Auth: gọi Server Action
// - Cập nhật store với data phù hợp

import { useCallback, useEffect, useRef } from "react";

// Orchestrates guest vs auth cart logic
export function CartInitializer({ initialUser }) {
  // ...sync logic
}
```

### Tab Sync

**[KHÔNG TÌM THẤY]** - Không thấy `BroadcastChannel` hay `storage` event listener.

---

## 5. Form State

### Library: React Hook Form + Zod

**Evidence - `package.json`:**

```json
"@hookform/resolvers": "^5.2.2",
"react-hook-form": "^7.69.0",
"zod": "^4.2.1"
```

### Pattern

```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
});

type FormValues = z.infer<typeof schema>;

const form = useForm<FormValues>({
  resolver: zodResolver(schema),
  defaultValues: { name: "", email: "" },
});
```

---

## 6. Logical Separation

### Khi nào dùng Global State?

| Scenario                  | Solution        | Evidence               |
| ------------------------- | --------------- | ---------------------- |
| Cart count (header badge) | Zustand         | `useCartStore`         |
| Notification count        | Zustand         | `useNotificationStore` |
| Component-local state     | useState        | Product card loading   |
| Server data               | SWR (in hooks)  | Product lists          |
| Form data                 | React Hook Form | All forms              |
| URL state                 | nuqs            | Filters, pagination    |

### URL State với nuqs

**Evidence - `package.json:57`:**

```json
"nuqs": "^2.8.6"
```

**Usage trong filter/search:**

```typescript
import { useQueryState, parseAsInteger, parseAsString } from "nuqs";

const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));
const [sort, setSort] = useQueryState("sort", parseAsString);
```

---

## 7. Zustand Best Practices (từ codebase)

### Selector Pattern

```typescript
// ✅ Chỉ lấy những gì cần - tránh re-render
const count = useCartStore((state) => state.count);
const increment = useCartStore((state) => state.increment);

// ❌ Không lấy toàn bộ store
const store = useCartStore();
```

### Async Actions trong Store

```typescript
// Pattern từ notification.store.ts:124-152
refresh: async () => {
  set({ isLoading: true });
  try {
    const [listRes, countRes] = await Promise.all([
      import("@/features/notifications/actions").then((mod) =>
        mod.getNotificationsAction(10)
      ),
      import("@/features/notifications/actions").then((mod) =>
        mod.getUnreadCountAction()
      ),
    ]);

    if (listRes.data && Array.isArray(listRes.data)) {
      set({ notifications: listRes.data });
    }
    if (countRes.success && countRes.data) {
      set({ unreadCount: countRes.data.count });
    }
  } catch (e) {
    console.error("Store refresh failed", e);
  } finally {
    set({ isLoading: false });
  }
},
```

### List Slicing để giữ Memory nhẹ

```typescript
// notification.store.ts:73
const newNotifications = [notification, ...currentList].slice(0, 10);
```
