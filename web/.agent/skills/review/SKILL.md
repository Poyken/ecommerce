---
name: Code Review Skill
description: Kỹ năng review code theo chuẩn dự án
---

# Code Review Skill

## 🎯 Trigger Phrases

**Kích hoạt khi user nói:**

- "Review code này", "Check giùm cái này", "Xem code"
- "Review PR", "Kiểm tra pull request"
- "Code này có vấn đề gì không?"

**Kích hoạt khi context:**

- User paste code block lớn
- User share link GitHub PR
- User hỏi về coding standards

---

## Mục đích

Skill này hướng dẫn cách review code một cách có hệ thống, tập trung vào các patterns và anti-patterns đặc thù của dự án.

## Quy trình Review

### 1. Kiểm tra Type Safety

```typescript
// ❌ Anti-pattern: Sử dụng any
function processData(data: any) { ... }

// ✅ Pattern đúng: Định nghĩa interface
interface ProcessData {
  id: string;
  value: number;
}
function processData(data: ProcessData) { ... }
```

**Lưu ý dự án**: Hiện có ~176 chỗ dùng `: any`. Khi review, cố gắng giảm số này.

### 2. Kiểm tra Error Handling

```typescript
// ❌ Anti-pattern
} catch (error) {
  console.log(error);
}

// ✅ Pattern đúng (theo dự án)
} catch (error: unknown) {
  return {
    error: (error as Error).message || "Default message",
  };
}
```

### 3. Kiểm tra Import Order

Thứ tự chuẩn:

1. `"use client"` / `"use server"`
2. Feature imports (`@/features/...`)
3. Shared components (`@/components/...`)
4. i18n (`@/i18n/routing`)
5. Lib utilities (`@/lib/...`)
6. External packages

### 4. Kiểm tra Component Structure

- [ ] Props interface được export
- [ ] Component được export dạng named export
- [ ] Có JSDoc comment giải thích (cho components phức tạp)
- [ ] Sử dụng `cn()` cho className merging

### 5. Kiểm tra Performance

- [ ] Không có unnecessary re-renders
- [ ] `useCallback` cho event handlers passed to children
- [ ] `useMemo` cho expensive computations
- [ ] Lazy loading cho heavy components

## Checklist Nhanh

```
[ ] Type safety: Không có any mới
[ ] Error handling: catch (error: unknown)
[ ] Import order: Đúng thứ tự
[ ] Naming: kebab-case files, PascalCase components
[ ] Exports: Named exports (không default)
[ ] Comments: JSDoc cho public functions
```

## Red Flags

🚩 **Dừng review và yêu cầu sửa ngay:**

- Secrets/passwords hardcoded
- SQL injection vulnerabilities
- XSS vulnerabilities
- Missing authentication checks
- Infinite loops potential
