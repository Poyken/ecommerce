# Implementation Plan - UI Contrast Polish & E2E Test Setup

The current UI standardization uses `text-white` and light gradients that lack contrast, especially in Light Mode where the background is pure white. Additionally, E2E tests are failing because of a missing test directory.

## 1. Contrast & Accessibility Enhancements

- **Fix Heading Contrast**: Update `h1`, `h2`, `h3` gradients to use `foreground` colors instead of hardcoded `white`.
  - From: `from-white to-white/40`
  - To: `from-foreground to-foreground/50` (or keep pure `text-foreground` for maximum contrast).
- **Update Glass Effect**: Ensure `glass-card` and `glass-premium` borders are visible in both light and dark modes.
- **Aurora Glow Adjustments**: Ensure background glows don't interfere with text readability.
- **Affected Files**:
  - `web/app/[locale]/(shop)/brands/brands-client.tsx`
  - `web/app/[locale]/(shop)/categories/categories-client.tsx`
  - `web/app/[locale]/(shop)/wishlist/wishlist-client.tsx`
  - `web/app/[locale]/(shop)/checkout/checkout-client.tsx`
  - `web/app/[locale]/(shop)/shop-contact/page.tsx`
  - `web/app/[locale]/(shop)/orders/orders-client.tsx`
  - `web/app/[locale]/(shop)/orders/[id]/page.tsx`

## 2. E2E Test Infrastructure

- **Setup Playwright Directory**: Create the `./e2e` directory in the `web` package as configured in `playwright.config.ts`.
- **Create Basic Smoke Tests**:
  - `web/e2e/smoke.spec.ts`: Verify that critical pages (Home, Shop, Brands, Categories, Contact) load without crashing and have correct titles.
- **Verify Build**: Run `npm run test:e2e` to ensure the infrastructure is working.

## 3. Standardizing Remaining Pages

- **Home Page Hero**: Refactor the Hero section in `features/products/components/home-content.tsx` to use the fixed background from `HomeWrapper` and remove redundant local backgrounds.
- **Offline Page**: Apply the same Neo-Brutalism/Glassmorphism theme to `web/app/[locale]/(shop)/offline/page.tsx`.

## 4. Verification

- Manual check of all updated pages in both Light and Dark mode.
- Ensure all E2E tests pass.
- Run `npm run build` to ensure no regression.
