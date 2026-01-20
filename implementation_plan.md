# Implementation Plan - Core Commerce Logic Verification

This plan focuses on verifying and enforcing the core commerce flow (Cart & Checkout) using End-to-End tests, ensuring the implemented hybrid cart and checkout logic functions as expected.

## 1. Objectives

- **Verify Guest Cart Flow**: Ensure unauthenticated users can add items to cart and view them.
- **Verify Checkout Navigation**: Ensure guest users are redirected to login upon checkout.
- **Verify UI Integrity**: Ensure Cart and Checkout pages render correctly with the new standardized UI.

## 2. Testing Strategy (E2E)

We will create a new Playwright test suite `web/e2e/cart-flow.spec.ts` covering:

1.  **Product Navigation**: Go to a product page.
2.  **Add to Cart**: Click "Add to Cart" button.
3.  **Cart Verification**:
    - Verify badge update (if visible).
    - Navigate to `/cart`.
    - Verify item appears in cart.
    - Verify total calculation.
4.  **Checkout Access**:
    - Click "Checkout" button.
    - Verify redirection to `/login` (since we are guest).

## 3. Execution Steps

1.  **Create Test File**: `web/e2e/cart-flow.spec.ts`.
2.  **Run Tests**: Execute `npx playwright test e2e/cart-flow.spec.ts`.
3.  **Analysis**: If tests pass, the core logic is considered "Implemented & Verified". If fail, debug and fix found issues.

## 4. Documentation

- Update `CONTEXT.md` with verification status.
