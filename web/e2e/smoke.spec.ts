import { test, expect } from '@playwright/test';

test.describe('Smoke Tests - Critical Pages', () => {
  test('should load Home page', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Luxe/i);
  });

  test('should load Shop page', async ({ page }) => {
    await page.goto('/shop');
    await expect(page).toHaveTitle(/Shop|Luxe/i);
  });

  test('should load Brands page', async ({ page }) => {
    await page.goto('/brands');
    await expect(page).toHaveTitle(/Brands|Luxe/i);
  });

  test('should load Categories page', async ({ page }) => {
    await page.goto('/categories');
    await expect(page).toHaveTitle(/Categories|Luxe/i);
  });

  test('should load Contact page', async ({ page }) => {
    await page.goto('/shop-contact');
    await expect(page).toHaveTitle(/Contact|Luxe/i);
  });
});
