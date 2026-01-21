# Playwright E2E Testing Guide

> **Stack**: Playwright  
> **Goal**: 100% coverage cho critical user flows (Checkout, Auth, Admin)  
> **Environment**: Runs against local dev or staging/production URLs

---

## 1. Overview

E2E tests mô phỏng trải nghiệm người dùng thực trên trình duyệt. Chúng giúp đảm bảo các component API và Web hoạt động trơn tru với nhau.

---

## 2. Setup & Configuration

### File: `playwright.config.ts`

```typescript
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    {
      name: "webkit",
      use: { ...devices["Desktop Safari"] },
    },
    {
      name: "mobile-chrome",
      use: { ...devices["Pixel 5"] },
    },
  ],
});
```

---

## 3. Critical Flows to Test

### 3.1 Authentication Flow

- [ ] Sign Up with email verification
- [ ] Login with correct/incorrect credentials
- [ ] Forgot password / Reset password
- [ ] Protected routes access control

### 3.2 Customer Journey

- [ ] Search product
- [ ] Add to cart & modify quantity
- [ ] Full Checkout (Shipping → Payment → Confirmation)
- [ ] View Order in profile

### 3.3 Admin Dashboard

- [ ] Login as admin
- [ ] Product CRUD (Create, Update, Delete)
- [ ] Order management (Change status)
- [ ] AI feature verification (Generate description)

---

## 4. Writing Tests

### Example: Basic Checkout Test

```typescript
// web/e2e/checkout.spec.ts
import { test, expect } from "@playwright/test";

test("Full checkout flow for registered user", async ({ page }) => {
  // 1. Login
  await page.goto("/auth/login");
  await page.fill('input[name="email"]', "test@example.com");
  await page.fill('input[name="password"]', "Password123!");
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL("/");

  // 2. Search & Add to Cart
  await page.fill('input[placeholder*="Search"]', "iPhone");
  await page.press('input[placeholder*="Search"]', "Enter");
  await page.click("text=Add to Cart");

  // 3. Go to Cart
  await page.click('[aria-label="View Cart"]');
  await expect(page.locator("text=Shopping Cart")).toBeVisible();
  await page.click("text=Checkout");

  // 4. Fill Shipping & Place Order
  await page.fill('input[name="address"]', "123 E-commerce St");
  await page.click("text=Place Order");

  // 5. Verify Success
  await expect(page.locator("text=Thank you for your order")).toBeVisible();
  await expect(page.locator("text=Order ID:")).toBeVisible();
});
```

---

## 5. Page Object Model (POM)

Sử dụng POM để tái sử dụng code và dễ bảo trì.

```typescript
// web/e2e/models/LoginPage.ts
export class LoginPage {
  constructor(private page: Page) {}

  async navigate() {
    await this.page.goto("/auth/login");
  }

  async login(email: string, pass: string) {
    await this.page.fill('input[name="email"]', email);
    await this.page.fill('input[name="password"]', pass);
    await this.page.click('button[type="submit"]');
  }
}
```

---

## 6. Running Tests

```bash
# Chạy tất cả tests trên các browsers
npx playwright test

# Chạy có UI dashboard (recommend để debug)
npx playwright test --ui

# Chạy một file cụ thể
npx playwright test e2e/auth.spec.ts

# Debug một test step-by-step
npx playwright test --debug
```

---

## 7. Best Practices

### DO

- ✅ Sử dụng `data-testid` cho các stable selectors.
- ✅ Viết các test độc lập (không phụ thuộc vào state của test trước).
- ✅ Sử dụng `test.describe` để group các test liên quan.
- ✅ Mock externa services (ví dụ: Stripe payment gateway) bằng API intercepting.

### DON'T

- ❌ Sử dụng CSS selectors dễ thay đổi (`.btn-primary`).
- ❌ Hardcode sleep/delay (sử dụng Playwright's auto-waiting).
- ❌ Test những thứ đã được Unit test bao phủ.

---

## 8. CI/CD Integration

Tests được tự động chạy trong GitHub Actions:

```yaml
- name: Run E2E tests
  run: cd web && npx playwright test
```

Xem báo cáo khi fail:
GitHub Actions → Artifacts → **playwright-report**

---

**Location**: `web/e2e/`, `web/playwright.config.ts`
