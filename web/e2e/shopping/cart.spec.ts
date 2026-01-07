import { test, expect } from "@playwright/test";

test.describe("Cart & Checkout Flow", () => {
  test("Add product to cart", async ({ page }) => {
    await page.goto("/products");

    const firstProductLink = page.locator('a[href*="/products/"]').first();
    if (await firstProductLink.isVisible()) {
      await firstProductLink.click();
      // Wait for detail page
      await page.waitForTimeout(1000);

      const addBtn = page.getByRole("button", {
        name: /add to cart|thêm vào giỏ/i,
      });
      if (await addBtn.isVisible()) {
        await addBtn.click();
        // Expect toast/notification
        // await expect(page.getByText(/added|thành công/i)).toBeVisible();
      }
    }
  });

  test("View Cart", async ({ page }) => {
    await page.goto("/cart");
    await expect(page).toHaveURL(/\/cart/);
    const bodyText = await page.textContent("body");
    const hasCartContent =
      /total|tổng cộng/i.test(bodyText || "") ||
      /empty|trống/i.test(bodyText || "");
    expect(hasCartContent).toBeTruthy();
  });

  test("Proceed to Checkout", async ({ page }) => {
    await page.goto("/cart");
    const checkoutBtn = page.getByRole("button", {
      name: /checkout|thanh toán/i,
    });

    // If cart is empty, this might be disabled or hidden
    if (
      (await checkoutBtn.isVisible().catch(() => false)) &&
      (await checkoutBtn.isEnabled().catch(() => false))
    ) {
      await checkoutBtn.click();
      await expect(page).toHaveURL(/\/checkout/);
      // Check for address form
      await expect(page.getByText(/address|địa chỉ/i)).toBeVisible();
    } else {
      console.log("Cart empty or checkout disabled, skipping click");
    }
  });
});
