# Checklist Review Pull Request

> Checklist này dựa trên de-facto standards từ codebase, phân loại theo mức độ nghiêm trọng.

---

## 🚨 CRITICAL (Chặn Merge)

### Security

- [ ] **Không hardcode secrets/passwords**

  - Tại sao: Dự án dùng `.env` cho secrets
  - Check: grep `password`, `secret`, `apiKey` trong code

- [ ] **Không expose internal errors cho user**

  - Pattern đúng: `(error as Error).message || "Default message"`
  - Evidence: `features/auth/actions.ts:121-124`

- [ ] **Validate input cả client và server**
  - Pattern: Zod schemas + Server Action validation
  - Evidence: `lib/schemas.ts`, `features/auth/actions.ts:71-78`

### Logic Errors

- [ ] **Không có infinite loops tiềm ẩn**

  - Check: useEffect dependencies, recursive functions

- [ ] **Không có race conditions**
  - Pattern đúng: `set({ isFetching: true })` trước async
  - Evidence: Zustand stores đều có loading states

### Convention Violations

- [ ] **Đúng cấu trúc thư mục feature**

  ```
  features/[domain]/
  ├── actions.ts
  ├── components/
  ├── hooks/
  └── store/
  ```

  - Evidence: `features/cart/`, `features/notifications/`

- [ ] **Đúng naming convention**
  - Files: kebab-case (`product-card-base.tsx`)
  - Components: PascalCase (`ProductCardBase`)
  - Hooks: use + camelCase (`useCartStore`)
  - Evidence: `features/products/components/`

---

## ⚠️ MAJOR (Cần sửa)

### Performance

- [ ] **Không có re-render không cần thiết**

  - Check: useCallback cho event handlers passed to children
  - Đếm hiện tại: 107+ useCallback usages

- [ ] **useMemo cho expensive computations**

  - Pattern: `isDirty = useMemo(() => ...)`
  - Đếm hiện tại: 60+ useMemo usages
  - Evidence: `features/admin/components/` dialogs

- [ ] **Không gọi API trong loop**
  - Pattern đúng: `Promise.all([...])`
  - Evidence: `notification.store.ts:128-135`

### TypeScript

- [ ] **Hạn chế `: any` mới**

  - Hiện trạng: ~176 chỗ dùng `: any` (cần giảm)
  - OK nếu: workaround cho i18n routing (`as any` cho href)
  - Evidence: `product-card-base.tsx:84`

- [ ] **Props interface được export**

  - Pattern: `export interface [Component]Props`
  - Evidence: `ProductCardBaseProps`

- [ ] **`catch (error: unknown)` cho error handling**
  - Pattern: `} catch (error: unknown) { (error as Error).message }`
  - Evidence: `features/auth/actions.ts:121`

### Styling

- [ ] **Dùng Design Tokens, không hardcode colors**

  - Tokens: `--primary`, `--accent`, `--destructive`
  - Evidence: `globals.css:44-61`

- [ ] **Dùng `cn()` để merge classNames**

  - Pattern: `cn("base", isActive && "active", className)`
  - Evidence: Tất cả components

- [ ] **Đúng class order (Tailwind)**
  - Layout → Sizing → Spacing → Typography → Colors → Effects → States

---

## 📝 MINOR (Nhắc nhở)

### Clean Code

- [ ] **Function không quá 50 dòng**

  - Tách helper functions nếu dài

- [ ] **Folder không quá 3 cấp lồng**

  - Pattern: `features/[domain]/components/[file].tsx`

- [ ] **Tránh deep object nesting**
  - Dùng optional chaining: `item.sku?.product?.images?.[0]`

### Documentation

- [ ] **JSDoc cho functions/components phức tạp**

  - Pattern dự án (cho thực tập sinh):

  ```typescript
  /**
   * =====================================================================
   * COMPONENT NAME - Mô tả ngắn
   * =====================================================================
   *
   * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
   * 1. [Pattern 1]
   * 2. [Pattern 2]
   */
  ```

  - Evidence: `product-card-base.tsx:41-60`

- [ ] **README cho module mới** (nếu có)

### Code Quality

- [ ] **Named exports (không default export)**

  - Pattern: `export function Component()`
  - Exception: Page components

- [ ] **Imports đúng thứ tự**
  1. "use client" / "use server"
  2. Feature imports (@/features/)
  3. Shared components (@/components/)
  4. i18n (@/i18n/)
  5. Lib (@/lib/)
  6. External packages

---

## Quy trình Review

### 1. Trước khi review

```bash
# Pull code về local
git fetch origin && git checkout feature-branch

# Chạy lint
npm run lint

# Chạy type check
npx tsc --noEmit
```

### 2. Review checklist

- [ ] Đọc PR description
- [ ] Check files changed
- [ ] Đi qua checklist trên

### 3. Sau khi review

- [ ] Comment constructive
- [ ] Approve hoặc Request Changes
- [ ] Tag severity: 🚨 CRITICAL / ⚠️ MAJOR / 📝 MINOR
