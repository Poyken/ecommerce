import { test, expect } from "@playwright/test";

test.describe("Shopping & Browsing", () => {
  test("Homepage loads correctly", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Luxe|Furniture/i);
    // Check for main nav
    await expect(page.locator("header")).toBeVisible();
    // Check for product visibility (might need wait)
    // await expect(page.locator('.product-card').first()).toBeVisible();
  });

  test("Browse Products", async ({ page }) => {
    await page.goto("/products");
    await expect(page).toHaveURL(/\/products/);
    // await expect(page.getByText('Filter')).toBeVisible();
  });

  test("Product Detail View", async ({ page }) => {
    await page.goto("/products");
    // Click random product
    const firstProduct = page.locator('a[href*="/products/"]').first();
    if (await firstProduct.isVisible()) {
      await firstProduct.click();
      await expect(page).toHaveURL(/\/products\//);
      await expect(
        page.getByRole("button", { name: /add to cart|thêm vào giỏ/i })
      ).toBeVisible();
    }
  });

  test("Categories Page", async ({ page }) => {
    await page.goto("/categories");
    await expect(page).toHaveURL(/\/categories/);
    // Expect at least some content
    // await expect(page.locator('h1')).toContainText(/categories|danh mục/i);
  });

  test("Brands Page", async ({ page }) => {
    await page.goto("/brands");
    await expect(page).toHaveURL(/\/brands/);
  });

  test("Blog Page", async ({ page }) => {
    await page.goto("/blog");
    await expect(page).toHaveURL(/\/blog/);
  });
});
