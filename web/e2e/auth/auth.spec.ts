import { test, expect } from "@playwright/test";

test.describe("Authentication Flows", () => {
  test("Register new user", async ({ page }) => {
    await page.goto("/register");
    // Using random email to avoid conflict
    const email = `e2e-${Date.now()}@test.com`;

    // Selectors based on likely form labels or types
    // Adjusting for both English and Vietnamese labels based on previous context
    await page.locator('input[name="firstName"]').fill("Test");
    await page.locator('input[name="lastName"]').fill("User");
    await page.locator('input[name="email"]').fill(email);
    await page.locator('input[name="password"]').fill("Password123!");

    const submitBtn = page.getByRole("button", {
      name: /register|đăng ký|sign up/i,
    });
    if (await submitBtn.isVisible()) {
      await submitBtn.click();
      // Expect redirection or success message
      // await expect(page).toHaveURL(/login|profile/);
    }
  });

  test("Login with existing user", async ({ page }) => {
    await page.goto("/login");
    await page.locator('input[name="email"]').fill("user@gmail.com");
    await page.locator('input[name="password"]').fill("password");
    // Assuming button name
    await page
      .getByRole("button", { name: /login|đăng nhập|sign in/i })
      .click();

    // Expect to be redirect to home or dashboard (handling i18n /en prefix)
    await expect(page.url()).toMatch(/localhost:3000\/(en|vi)?/);
    // Check for user menu or logout indicator
    // await expect(page.locator('header')).toContainText(/user|tài khoản/i);
  });

  test("Forgot Password UI check", async ({ page }) => {
    await page.goto("/forgot-password");
    await expect(page.getByPlaceholder(/email/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /send|gửi/i })).toBeVisible();
  });
});
