---
description: Quy trình debug và sửa bug có hệ thống cho dự án Next.js
---

# Quy Trình Sửa Bug

> Dựa trên tooling và patterns thực tế trong dự án.

## Testing Framework

| Tool            | Purpose       | Evidence                 |
| --------------- | ------------- | ------------------------ |
| Vitest          | Unit tests    | `vitest.config.mts`      |
| Playwright      | E2E tests     | `playwright.config.ts`   |
| Testing Library | React testing | `@testing-library/react` |

---

## Bước 1: Reproduce & Document

### Tái hiện lỗi

```markdown
**Bug Report**

- URL/Page:
- Steps to reproduce:

  1.
  2.
  3.

- Expected behavior:
- Actual behavior:
- Screenshots/video:
```

### Check console errors

```javascript
// Browser DevTools
// Console tab: Filter by errors
// Network tab: Check failed requests (red)
```

---

## Bước 2: Viết Failing Test

```typescript
// __tests__/bug-[description].test.ts
import { describe, it, expect } from "vitest";

describe("Bug: [description]", () => {
  it("should [expected behavior]", () => {
    // Arrange

    // Act

    // Assert
    expect(result).toBe(expected);
  });
});
```

### Run test

```bash
# Run specific test
npm test -- bug-description

# Watch mode
npm test
```

---

## Bước 3: Debug

### Common Files to Check

| Issue Type   | Check Files                                  |
| ------------ | -------------------------------------------- |
| API errors   | `lib/http.ts`, `lib/error-utils.ts`          |
| Auth issues  | `lib/session.ts`, `features/auth/actions.ts` |
| State bugs   | `features/[domain]/store/`                   |
| UI rendering | `features/[domain]/components/`              |

### Debug Server Actions

```typescript
// Thêm logging tạm
export async function myAction() {
  console.log("[myAction] Input:", input);

  try {
    const result = await http.post("/endpoint", data);
    console.log("[myAction] Result:", result);
    return { success: true, data: result };
  } catch (error: unknown) {
    console.error("[myAction] Error:", error);
    return { success: false, error: (error as Error).message };
  }
}
```

### Debug Zustand Store

```typescript
// Bật devtools trong development
import { devtools } from "zustand/middleware";

// Check Redux DevTools trong browser
```

---

## Bước 4: Common Bug Patterns

### 4.1 Hydration Mismatch

**Triệu chứng:**

```
Warning: Text content did not match. Server: "X" Client: "Y"
```

**Fix:**

```tsx
"use client";

import { useEffect, useState } from "react";

function Component() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null; // or skeleton

  return <DynamicContent />;
}
```

### 4.2 Server Action Không Chạy

**Checklist:**

- [ ] File có `"use server"` ở đầu?
- [ ] Function là `async`?
- [ ] `cookies()` được gọi trước `try/catch`?

```typescript
"use server";

export async function myAction() {
  await cookies(); // Trigger dynamic TRƯỚC try/catch

  try {
    // logic
  } catch (error: unknown) {
    // handle
  }
}
```

### 4.3 Data Không Cập Nhật

**Fix options:**

```typescript
// Option 1: revalidatePath
import { revalidatePath } from "next/cache";
revalidatePath("/path");

// Option 2: SWR mutate
const { mutate } = useSWR("/key", fetcher);
await mutate();

// Option 3: Zustand refresh
useMyStore.getState().refresh();
```

### 4.4 Type Errors Runtime

**Pattern:**

```typescript
// Check optional chaining
const value = data?.nested?.property;

// Validate data exists
if (!data || !Array.isArray(data)) {
  return [];
}
```

---

## Bước 5: Fix & Verify

### Apply fix

```typescript
// Comment giải thích fix
// FIX: [Bug description]
// Root cause: [Why it happened]
```

### Run tests

```bash
# Unit tests
npm run test:run

# E2E tests
npm run test:e2e

# Type check
npx tsc --noEmit

# Lint
npm run lint
```

---

## Bước 6: Commit

```bash
git add .
git commit -m "fix([scope]): [mô tả ngắn]

- Root cause: [nguyên nhân gốc]
- Solution: [giải pháp]

Closes #[issue-number]"
```

**Scopes từ dự án:** auth, cart, products, orders, checkout, notifications, admin

---

## Quick Reference

### Test Commands

```bash
npm test              # Watch mode
npm run test:run      # Run once
npm run test:e2e      # Playwright E2E
```

### Debug Commands

```bash
# Build để check errors
npm run build

# Type errors
npx tsc --noEmit

# Lint errors
npm run lint
```

### Clean Cache

```bash
# Next.js cache
rm -rf .next

# Node modules (last resort)
rm -rf node_modules && npm install
```
