---
name: Debug Skill
description: Kỹ năng debug hiệu quả cho dự án Next.js
---

# Debug Skill

## 🎯 Trigger Phrases

**Kích hoạt khi user nói:**

- "Sao nó lỗi?", "Không chạy", "Bị đỏ", "Có bug"
- "Debug cái này", "Tìm lỗi", "Fix bug"
- "Sao data không hiện?", "API không trả về gì"

**Kích hoạt khi context:**

- User paste error stack trace
- User paste console logs có error
- User mô tả unexpected behavior

---

## Mục đích

Skill này hướng dẫn cách debug các vấn đề phổ biến trong dự án Next.js ecommerce.

## Debugging Flow

```
1. Reproduce → 2. Isolate → 3. Identify → 4. Fix → 5. Verify
```

## Common Issues & Solutions

### 1. Hydration Mismatch

**Triệu chứng:**

```
Warning: Text content did not match. Server: "X" Client: "Y"
```

**Nguyên nhân phổ biến:**

- Render khác nhau giữa server và client
- Sử dụng `Date.now()`, `Math.random()` trong render
- Browser extensions can mảnh DOM

**Debug steps:**

```typescript
// 1. Wrap dynamic content trong useEffect
const [mounted, setMounted] = useState(false);
useEffect(() => setMounted(true), []);
if (!mounted) return null;

// 2. Hoặc dùng dynamic import với ssr: false
const Component = dynamic(() => import("./Component"), { ssr: false });
```

### 2. Server Action Không Hoạt Động

**Debug steps:**

```typescript
// 1. Kiểm tra "use server" directive
"use server"; // Phải ở đầu file hoặc đầu function

// 2. Kiểm tra async
export async function myAction() { ... } // Phải async

// 3. Check cookies() được gọi trước try/catch
export async function myAction() {
  await cookies(); // Trigger dynamic TRƯỚC try/catch
  try {
    // logic
  } catch { ... }
}
```

### 3. Data Không Cập Nhật

**Debug steps:**

```typescript
// 1. Kiểm tra revalidatePath
import { revalidatePath } from "next/cache";
revalidatePath("/path", "layout"); // Sau mutation

// 2. Kiểm tra SWR mutate
const { mutate } = useSWR(...);
await mutate(); // Force revalidate

// 3. Kiểm tra cache tags
fetch(url, { next: { tags: ["products"] } });
revalidateTag("products");
```

### 4. Type Errors với `as any`

**Khi nào chấp nhận được:**

```typescript
// ✅ OK: Next.js i18n routing workaround
router.prefetch(`/products/${id}` as any);
href={link.href as any}

// ❌ Không OK: Lazy typing
const data = response.data as any; // Định nghĩa type!
```

### 5. Authentication Issues

**Debug steps:**

```typescript
// 1. Kiểm tra cookies
const cookieStore = await cookies();
const token = cookieStore.get("accessToken")?.value;
console.log("Token exists:", !!token);

// 2. Kiểm tra session
import { verifySession } from "@/lib/session";
const session = await verifySession();
console.log("Session valid:", session?.userId);

// 3. Kiểm tra middleware
// Xem proxy.ts hoặc middleware.ts
```

## Debug Tools

### Browser DevTools

```javascript
// React DevTools: Component state
// Network tab: API calls
// Console: Errors, logs
```

### VS Code

```json
// launch.json cho server-side debugging
{
  "type": "node",
  "request": "attach",
  "name": "Attach to Next.js",
  "port": 9229
}
```

### Logging Pattern

```typescript
// Dùng prefix để dễ filter
console.log("[ProductCard]", { id, name, price });
console.error("[API Error]", error);
```

## Quick Fixes

| Vấn đề           | Quick Fix                       |
| ---------------- | ------------------------------- |
| Module not found | `npm install`                   |
| Type error       | Check tsconfig paths            |
| Build error      | `rm -rf .next && npm run build` |
| Cache issue      | `rm -rf .next/cache`            |
