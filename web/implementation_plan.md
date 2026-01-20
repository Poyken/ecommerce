# Implementation Plan - UI Synchronization & Super Admin Polish

Synchronize the Super Admin UI with the Admin UI, focusing on sidebar consistency, page headers with colored icons, loading states, and ensuring a smooth demo experience pointing to the shop.

## 1. Sidebar Synchronization

- [ ] Fix `usePathname` in `SuperAdminSidebar` to use `@/i18n/routing`.
- [ ] Align active state styles (primary background, white text) with the Admin sidebar.
- [ ] Ensure "Back to Store" and "Tenant Admin" links are correctly styled and functional.

## 2. Page Header & Icon Polish

- [ ] Systematically update `AdminPageHeader` across all super-admin pages:
  - [ ] Dashboard: `Shield` (Violet)
  - [ ] Tenants: `Store` (Indigo)
  - [ ] Plans: `Zap` (Amber)
  - [ ] Subscriptions: `CreditCard` (Emerald)
  - [ ] Roles: `Shield` (Violet)
  - [ ] Permissions: `Settings` (Sky)
  - [ ] Users: `Users` (Blue)
  - [ ] Audit Logs: `History` (Slate)
  - [ ] Settings: `Settings` (Cyan)
- [ ] Ensure all necessary icons are imported.
- [ ] Verify `AdminPageHeader` supports `fill-current/10` for better aesthetics.

## 3. Loading State Alignment

- [ ] Ensure `LoadingScreen` uses `variant="classic"` (circular) instead of `luxury` across super-admin pages and layouts to match the regular Admin loading style.

## 4. Navigation & Demo Experience

- [ ] Verify "Back to Store" link points to `/`.
- [ ] Check if `seed` data needs updates for a better demo (e.g., more tenants, plans).
- [ ] Perform a quick dry run of the navigation to ensure no "Page not found" or redirect loops.

## 5. Verification

- [ ] Run `npm run lint` and `npm run build` (if possible) to check for errors.
- [ ] Manual check of key pages.
