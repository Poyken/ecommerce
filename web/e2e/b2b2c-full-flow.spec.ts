import { test, expect } from "@playwright/test";

const getRandomString = () => Math.random().toString(36).substring(7);

test.describe("B2B2C Full Flow", () => {
  test.setTimeout(180000); // 3 minutes total

  test("Complete Flow: Onboarding -> Admin Setup -> Customer Purchase", async ({
    page,
  }) => {
    const storeName = `AutoStore ${getRandomString()}`;
    const slug = storeName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "")
      .replace(/^-+|-+$/g, "");
    const adminEmail = `admin_${getRandomString()}@test.com`;
    // Use simple password that meets complexity if needed?
    const adminPassword = "Password123!";
    const customerEmail = `customer_${getRandomString()}@test.com`;

    console.log(`[TEST] Starting B2B2C Flow for Store: ${storeName} (${slug})`);

    // Enable logging
    page.on("console", (msg) => console.log(`[BROWSER]: ${msg.text()}`));
    page.on("pageerror", (err) =>
      console.log(`[BROWSER ERROR]: ${err.message}`),
    );

    // =========================================================================
    // PHASE 1: TENANT CREATION (ONBOARDING)
    // =========================================================================
    console.log("[PHASE 1] Starting Onboarding...");
    await page.goto("/onboarding");

    // Step 1: Store Info
    await expect(page.locator("text=Thiết lập cửa hàng")).toBeVisible();
    // Use placeholder-based selectors that match the exact onboarding form
    await page.fill('input[placeholder="VD: Shop Thời Trang ABC"]', storeName);
    // Password field (has placeholder "••••••••")
    await page.fill('input[placeholder="••••••••"]', adminPassword);
    // Email field (has placeholder "email@shop.com")
    await page.fill('input[placeholder="email@shop.com"]', adminEmail);
    // Phone is optional but we fill it for completeness
    await page.fill('input[placeholder="0912 345 678"]', "0900000000");

    console.log(
      `[PHASE 1] Form filled - Email: ${adminEmail}, Password: ${adminPassword}`,
    );
    // Using generic address fill if selector matches
    const addressInput = page.locator(
      'input[placeholder*="địa chỉ"], input[placeholder*="Số nhà"]',
    );
    if (await addressInput.isVisible()) {
      await addressInput.fill("123 Test Street");
    }

    await page.click('button:has-text("Tiếp tục")');

    // Step 2: Categories
    console.log("[PHASE 1] Selecting Category...");
    await expect(
      page.locator("text=Bạn kinh doanh ngành hàng gì?"),
    ).toBeVisible();
    await page.click('button:has-text("Thời trang")');
    await page.click('button:has-text("Tiếp tục")');

    // Step 3: Theme
    console.log("[PHASE 1] Selecting Theme...");
    await expect(page.locator("text=Chọn phong cách giao diện")).toBeVisible();
    await page.click('button:has-text("Modern")');
    await page.click('button:has-text("Tiếp tục")');

    // Step 4: Completion
    console.log("[PHASE 1] Finalizing...");
    await expect(page.locator("text=Sẵn sàng bắt đầu!")).toBeVisible();

    // Intercept the tenant registration request to verify payload
    const tenantRegistrationPromise = page.waitForRequest((req) =>
      req.url().includes("/tenants/public-register"),
    );

    // Click Start
    await page.click('button:has-text("VÀO DASHBOARD")');

    // Capture and log the registration request
    const registrationRequest = await tenantRegistrationPromise;
    const requestBody = registrationRequest.postDataJSON();
    console.log(
      "[PHASE 1 DEBUG] Tenant Registration Payload:",
      JSON.stringify(requestBody),
    );
    console.log(
      `[PHASE 1 DEBUG] AdminEmail in payload: ${requestBody?.adminEmail}`,
    );
    console.log(
      `[PHASE 1 DEBUG] AdminPassword in payload: ${requestBody?.adminPassword ? "[SET]" : "[EMPTY]"}`,
    );

    // Wait for Hard Redirect to Subdomain
    await page.waitForURL(new RegExp(`${slug}.localhost`), { timeout: 60000 });
    console.log(`[PHASE 1] Redirected to Tenant: ${page.url()}`);

    // =========================================================================
    // PHASE 2: TENANT ADMIN SETUP
    // =========================================================================
    console.log("[PHASE 2] Admin Login...");

    // Ensure we are at login
    // await expect(page).toHaveURL(/login/); // Might be redundant if waitForURL passed

    // Login Form
    // Using generic Input lookup by type if name attr is missing, but name="email" is standard
    await page.fill('input[name="email"]', adminEmail);
    await page.fill('input[name="password"]', adminPassword);

    const loginResponsePromise = page.waitForResponse(
      (resp) =>
        resp.url().includes("/auth/login") || resp.url().includes("login"),
    );

    await page.click('button[type="submit"]');

    try {
      const loginResponse = await loginResponsePromise;
      console.log(`[PHASE 2 DEBUG] Login Status: ${loginResponse.status()}`);
      if (loginResponse.status() !== 200 && loginResponse.status() !== 201) {
        // Try to read text if possible
        try {
          console.log(
            `[PHASE 2 DEBUG] Login Body: ${await loginResponse.text()}`,
          );
        } catch (e) {
          console.log("[PHASE 2 DEBUG] Could not read response body");
        }
      }
    } catch (e) {
      console.log(
        "[PHASE 2 DEBUG] No login response captured (timeout or error)",
      );
    }

    // Debugging: Wait a bit to see if error appears
    try {
      await expect(
        page.locator('.text-red-500, [role="alert"], .text-destructive'),
      ).toBeVisible({ timeout: 2000 });
      const errorText = await page
        .locator('.text-red-500, [role="alert"], .text-destructive')
        .textContent();
      console.log(`[PHASE 2 ERROR] Login failed with UI error: ${errorText}`);
    } catch {
      // No error visible, good
    }

    console.log("[PHASE 2] Waiting for Admin Redirect...");
    // Increase timeout for cold starts or complex permission checks
    // Fast Refresh during development can take 25+ seconds
    await page.waitForURL(/\/admin/, { timeout: 60000 });
    console.log("[PHASE 2] Logged into Admin Dashboard");

    // =========================================================================
    // PHASE 2.1: CREATE PRODUCT
    // =========================================================================
    console.log("[PHASE 2.1] Creating Product...");
    // Navigate to products list page (product creation uses a dialog, not a separate page)
    await page.goto(`http://${slug}.localhost:3000/admin/products`);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(3000); // Wait for dynamic content to load

    // Wait for page to load - look for any content on the products page
    console.log("[PHASE 2.1] Waiting for Products page...");
    // Look for table, button with Plus icon, or any admin layout element
    await expect(
      page
        .locator(
          'table, [role="table"], button:has(svg), .lucide-plus, .lucide-package',
        )
        .first(),
    ).toBeVisible({ timeout: 30000 });
    console.log("[PHASE 2.1] Products page loaded");

    // Click the Create/Add Product button to open dialog
    const createButton = page
      .locator(
        'button:has-text("Create Product"), button:has-text("Thêm sản phẩm"), button:has-text("Thêm Mới"), button:has(svg.lucide-plus)',
      )
      .first();
    await expect(createButton).toBeVisible({ timeout: 10000 });
    await createButton.click();
    console.log("[PHASE 2.1] Clicked Create Product button");

    // Wait for dialog to open - use getByRole to get the actual dialog, not the overlay
    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 10000 });

    const productName = `Luxury Sofa ${getRandomString()}`;
    // Fill in the product form in dialog - Use ID from component if possible
    const nameInput = page
      .locator(
        '#edit-name, input[name="name"], [aria-label*="name"], [placeholder*="name"]',
      )
      .first();
    await expect(nameInput).toBeVisible({ timeout: 10000 });
    await nameInput.fill(productName);
    console.log("[PHASE 2.1] Filled product name:", productName);

    test.setTimeout(600000); // 10 minutes for full flow in dev

    // Select Category (Radix Select)
    const categoryLabel = page
      .locator('label:has-text("Category"), label:has-text("Danh mục")')
      .first();
    const categoryTrigger = page
      .locator(
        'div:has(> label:has-text("Category")), div:has(> label:has-text("Danh mục"))',
      )
      .locator("button")
      .first();

    if (await categoryTrigger.isVisible({ timeout: 5000 })) {
      await categoryTrigger.click({ force: true });
      await page.waitForTimeout(2000);

      const options = await page.locator('[role="option"]').allTextContents();
      console.log(`[PHASE 2.1] Found Category options: ${options.join(", ")}`);

      // Look for "General" or "Mặc định" to click
      const option = page
        .locator(
          '[role="option"]:has-text("General"), [role="option"]:has-text("Mặc định")',
        )
        .first();
      if (await option.isVisible({ timeout: 5000 })) {
        await option.click();
        console.log("[PHASE 2.1] Selected Category by clicking option");
      } else {
        // Fallback to keyboard
        await page.keyboard.press("ArrowDown");
        await page.keyboard.press("Enter");
        console.log("[PHASE 2.1] Selected Category via Keyboard (Fallback)");
      }
    }

    // Select Brand (Radix Select)
    const brandTrigger = page
      .locator(
        'div:has(> label:has-text("Brand")), div:has(> label:has-text("Thương hiệu"))',
      )
      .locator("button")
      .first();
    if (await brandTrigger.isVisible({ timeout: 5000 })) {
      await brandTrigger.click({ force: true });
      await page.waitForTimeout(2000);

      const options = await page.locator('[role="option"]').allTextContents();
      console.log(`[PHASE 2.1] Found Brand options: ${options.join(", ")}`);

      // Look for "Generic" or "Mặc định" to click
      const option = page
        .locator(
          '[role="option"]:has-text("Generic"), [role="option"]:has-text("Mặc định")',
        )
        .first();
      if (await option.isVisible({ timeout: 5000 })) {
        await option.click();
        console.log("[PHASE 2.1] Selected Brand by clicking option");
      } else {
        // Fallback to keyboard
        await page.keyboard.press("ArrowDown");
        await page.keyboard.press("Enter");
        console.log("[PHASE 2.1] Selected Brand via Keyboard (Fallback)");
      }
    }

    // Try to fill price if visible
    const priceInput = page
      .locator('input[name="price"], input[type="number"], #edit-price')
      .first();
    if (await priceInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      await priceInput.fill("5000000");
    }

    // Submit the dialog
    const submitBtn = page
      .locator(
        'button[type="submit"]:has-text("Create"), button[type="submit"]:has-text("Tạo"), button:has-text("Save"), [role="dialog"] button[type="submit"]',
      )
      .first();
    const isEnabled = await submitBtn.isEnabled();
    console.log(`[PHASE 2.1] Submit button enabled: ${isEnabled}`);

    await submitBtn.click({ force: true });

    // Wait for success (toast or dialog closes)
    await page.waitForTimeout(5000);
    console.log("[PHASE 2.1] Product Created (or attempted)");

    // =========================================================================
    // PHASE 3: CUSTOMER PURCHASE
    // =========================================================================
    console.log("[PHASE 3] Customer Purchase Flow...");

    // Logout via URL to be safe/fast
    await page
      .goto(`http://${slug}.localhost:3000/en/logout`, {
        waitUntil: "networkidle",
      })
      .catch(() => {});
    await page.waitForTimeout(3000);

    // Go to Shop Home
    console.log(
      "[PHASE 3] Navigating to Store Home:",
      `http://${slug}.localhost:3000/en`,
    );
    await page
      .goto(`http://${slug}.localhost:3000/en`, {
        waitUntil: "networkidle",
        timeout: 60000,
      })
      .catch((e) => console.log("[PHASE 3] Navigation warning:", e.message));

    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(2000);

    // Verify NOT logged in or at least on the home page
    const bodyText = await page.innerText("body");
    console.log("[PHASE 3] Page loaded. Title:", await page.title());

    // Find Product - Might need reload if ISR/Cache
    await page.reload();
    await expect(page.locator(`text=${productName}`)).toBeVisible({
      timeout: 10000,
    });
    await page.click(`text=${productName}`);

    // Add to Cart
    await page.click('button:has-text("Add to Cart")');
    await page.waitForTimeout(1000); // Wait for toast

    // Checkout
    await page.goto(`http://${slug}.localhost:3000/cart`);
    await page.click('a[href*="/checkout"]');

    // Redirect to Login -> Register
    await expect(page).toHaveURL(/login/);
    // Find Register link
    const registerLink = page.locator('a[href*="register"]');
    await registerLink.click();

    // Register Customer
    await page.waitForURL(/register/);
    await page.fill('input[name="firstName"]', "John");
    await page.fill('input[name="lastName"]', "Doe");
    await page.fill('input[name="email"]', customerEmail);
    await page.fill('input[name="password"]', "Password123!");
    await page.click('button[type="submit"]');

    // Should pass through to checkout
    await page.waitForURL(/checkout/, { timeout: 30000 });

    // Place Order
    console.log("[PHASE 3] Placing Order...");
    await page.click(
      'button:has-text("Place Order"), button:has-text("Complete Order"), button:has-text("Thanh toán")',
    );

    // Success
    await expect(
      page.locator("text=Order Confirmed, text=Thank you, text=Cảm ơn"),
    ).toBeVisible({ timeout: 30000 });

    console.log("[SUCCESS] Full B2B2C Flow Verified!");
  });
});
