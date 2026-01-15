# Refactor Queue: Option 1 (Clean House)

> **Goal:** Apply `.agent/rules/global.md` to all modules.
> **Status:** [ ] Pending, [/] In Progress, [x] Done

## Phase 1: High Priority (Known Debt/Core)

- [x] `src/notifications` (Contains TODOs)
- [x] `src/orders` (Complex Logic, Money Math)
- [x] `src/users` (Core Domain)
- [x] `src/auth` (Security Critical)

## Phase 2: Business Features

- [x] `src/products`
  - [x] `src/cart`
- [x] `src/promotions`
- [x] `src/reviews`
- [x] `src/payment`
- [x] `src/shipping`
- [x] `src/addresses`
- [x] `src/categories`
- [x] `src/brands`
- [x] `src/skus`
- [x] `src/wishlist`
- [x] `src/blog`
- [x] `src/pages`

## Phase 4: Infrastructure & Admin

- [ ] `src/core` (Careful with rules exceptions)
- [ ] `src/admin`
- [ ] `src/worker`
- [ ] `src/audit`
- [ ] `src/analytics`
- [ ] `src/integrations` (Cloudinary, Email, etc.)
- [ ] `src/tenants`

## Phase 5: AI Features

- [ ] `src/ai-chat`
- [ ] `src/rag`
- [ ] `src/insights`
- [ ] `src/images`
