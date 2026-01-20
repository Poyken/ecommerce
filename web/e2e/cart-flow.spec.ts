
import { test, expect } from '@playwright/test';

test.describe('Core Commerce Flow - Guest', () => {

  test('Guest can add item to cart and is redirected to login at checkout', async ({ page }) => {
    // Enable console logging
    page.on('console', msg => console.log(`BROWSER LOG: ${msg.text()}`));

    // 1. Navigate to Shop Page
    console.log('Navigating to Shop Page...');
    await page.goto('/shop');
    
    // 2. Select the first product
    console.log('Selecting first product...');
    const firstProduct = page.locator('a[href*="/products/"]').first();
    const count = await page.locator('a[href*="/products/"]').count();
    console.log(`Found ${count} product links`);
    await expect(firstProduct).toBeVisible({ timeout: 15000 });
    const href = await firstProduct.getAttribute('href');
    console.log(`Clicking product link: ${href}`);
    
    await Promise.all([
      page.waitForURL(/products/),
      firstProduct.click()
    ]);

    // 3. Verify Product Detail Page
    console.log('Verifying Product Detail Page...');
    // Ensure we are on a product page
    await expect(page).toHaveURL(/\/products\//);
    
    // Check for "Add to Cart" button (id="add-to-cart-btn" from view_file)
    const addToCartBtn = page.locator('button:has-text("Add to Cart"), #add-to-cart-btn').first();
    await expect(addToCartBtn).toBeVisible();

    // 4. Add to Cart
    console.log('Adding to Cart...');
    await expect(addToCartBtn).toBeEnabled();
    await addToCartBtn.click();
    
    // Wait for toast or some confirmation
    await page.waitForTimeout(2000); 

    // 6. Navigate to Cart
    console.log('Navigating to Cart...');
    await page.goto('/cart');

    // 7. Validate Cart Content
    console.log('Validating Cart Content...');
    // Check if there is at least one item row
    const checkoutLink = page.locator('a[href*="/login?callbackUrl="], a[href*="/checkout"]');
    await expect(checkoutLink).toBeVisible();
    await expect(page.locator('text=in your cart')).toBeVisible();

    // 8. Proceed to Checkout
    console.log('Proceeding to Checkout...');
    await checkoutLink.click();

    // 9. Verify Login Redirect
    console.log('Verifying Login Redirect...');
    // Expect url to contain /login
    await expect(page).toHaveURL(/login/);
  });

});
