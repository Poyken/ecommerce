# Implementation Plan: Complete Clean Architecture Tasks

**Created:** 2026-01-23
**Status:** PENDING APPROVAL

---

## Overview

Hoàn thành các task còn lại của Clean Architecture refactoring:

1. Verify API Build
2. Wire Use Cases to Controllers
3. Add Unit Tests
4. UI Components Review
5. Documentation Update

---

## Phase 1: Verify API Build 🔴

### Steps:

1. Chạy `npm run build` trong `api/`
2. Nếu có errors, fix từng lỗi
3. Verify build PASSED

### Files affected:

- Potentially any file with TypeScript errors

### Success criteria:

- `npm run build` exit code 0

---

## Phase 2: Wire Use Cases to Controllers 🟠

### Goal:

Kết nối Application layer use cases với Presentation layer (Controllers)

### Target Use Cases:

1. `GetProductsUseCase` → `ProductsController.findAll()`
2. `GetProductBySlugUseCase` → `ProductsController.findBySlug()`
3. `CreateProductUseCase` → `ProductsController.create()`

### Files to modify:

```
api/src/catalog/presentation/controllers/products.controller.ts (modify)
api/src/catalog/catalog.module.ts (verify providers)
```

### Pattern:

```typescript
// Controller injects Use Case
constructor(
  private readonly getProductsUseCase: GetProductsUseCase,
) {}

// Method delegates to Use Case
async findAll(query: GetProductsDto) {
  const result = await this.getProductsUseCase.execute(query);
  if (result.isFailure) {
    throw new BadRequestException(result.error);
  }
  return result.value;
}
```

### Success criteria:

- Controllers use Use Cases instead of direct repository calls
- Build passes
- Existing API behavior unchanged

---

## Phase 3: Add Unit Tests 🟡

### Goal:

Viết tests cho Clean Architecture layers (Catalog module làm mẫu)

### Test files to create:

```
api/src/catalog/domain/entities/__tests__/product.entity.spec.ts
api/src/catalog/domain/value-objects/__tests__/money.value-object.spec.ts
api/src/catalog/application/use-cases/__tests__/get-products.use-case.spec.ts
```

### Test coverage targets:

- Domain Entities: Business logic methods
- Value Objects: Validation và immutability
- Use Cases: Success/failure paths với mocked repositories

### Success criteria:

- Tests pass (`npm run test`)
- Coverage cho critical business logic

---

## Phase 4: UI Components Review 🟢

### Goal:

Áp dụng web-design-guidelines cho core UI components

### Components to review:

1. `Button` - Verify focus states, loading states
2. `Input` - Add proper labels, error states
3. `Card` - Check hover effects, animations
4. `Select` - Keyboard navigation
5. `Toast` - Auto-dismiss, accessibility

### Checklist per component:

- [ ] Focus visible states
- [ ] Reduced motion support
- [ ] Color contrast (WCAG AA)
- [ ] Touch targets (44x44px min)
- [ ] Keyboard navigation

### Files to review/modify:

```
web/components/ui/button.tsx
web/components/ui/input.tsx
web/components/ui/card.tsx
web/components/ui/select.tsx
web/components/ui/toast.tsx (if exists)
```

### Success criteria:

- Components pass accessibility review
- `npm run build` passes

---

## Phase 5: Documentation Update 🟢

### Files to update:

```
api/.agent/knowledge/CONTEXT.md
web/.agent/knowledge/CONTEXT.md
```

### Content:

- Add changelog entries for all completed tasks
- Update status indicators

---

## Execution Order

```
Phase 1 (API Build)
    ↓
Phase 2 (Wire Use Cases)
    ↓
Phase 3 (Unit Tests)
    ↓
Phase 4 (UI Review)
    ↓
Phase 5 (Documentation)
    ↓
Final Commit
```

---

## Risk Assessment

| Risk                                | Mitigation                               |
| ----------------------------------- | ---------------------------------------- |
| API build errors cascade            | Fix incrementally, commit after each fix |
| Use Case wiring breaks existing API | Keep old code, gradual migration         |
| Tests reveal bugs                   | Fix bugs, add regression tests           |

---

## Approval

**Waiting for user confirmation to proceed.**

Options:

- "OK" - Proceed with all phases
- "Turbo OK" - Auto-execute all phases
- "Phase X only" - Execute specific phase
