import { test, expect } from "@playwright/test";

test.describe("User Account Management", () => {
  test.beforeEach(async ({ page }) => {
    // Assume we need login for these
    await page.goto("/login");
    await page.locator('input[name="email"]').fill("user@gmail.com");
    await page.locator('input[name="password"]').fill("password");
    await page
      .getByRole("button", { name: /login|đăng nhập|sign in/i })
      .click();
    await page.waitForTimeout(1000); // Wait for auth state
  });

  test("View Profile", async ({ page }) => {
    await page.goto("/profile");
    await expect(page).toHaveURL(/\/(en|vi)?\/?profile/);
    // assert user email is visible
    await expect(page.getByText("user@gmail.com").first()).toBeVisible();
  });

  test("View Orders", async ({ page }) => {
    await page.goto("/orders");
    await expect(page).toHaveURL(/\/orders/);
    await expect(
      page.locator("h1").filter({ hasText: /order|đơn hàng/i })
    ).toBeVisible();
  });

  test.skip("Wishlist Access", async ({ page }) => {
    await page.goto("/wishlist");
    await expect(page).toHaveURL(/\/wishlist/);
  });

  test.skip("Notifications", async ({ page }) => {
    await page.goto("/notifications");
    await expect(page).toHaveURL(/\/notifications/);
  });
});
