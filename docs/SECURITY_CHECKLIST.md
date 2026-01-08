# Security Checklist & Guidelines

This document outlines the manual security review process for sensitive modules (`Auth`, `Payment`, `File Upload`).

## 🚨 Critical Areas (Line-by-Line Review Required)

### 1. Authentication & Authorization (`auth.service.ts`, Guards)

- [ ] **Privilege Escalation**: Ensure `role` or `permissions` updates are strictly validated. Users cannot grant themselves Admin rights.
- [ ] **Token Security**: Verify `accessToken` usage. Ensure `refreshToken` is HttpOnly/Secure.
- [ ] **Bypass**: Check if Guards (`JwtAuthGuard`, `PermissionsGuard`) cover ALL protected endpoints.

### 2. Payment Processing (`payment.service.ts`)

- [ ] **Amount Validation**: Ensure order total is recalculated on the server. NEVER trust the amount sent from the client.
- [ ] **Race Conditions**: Verify stock deduction happens atomically (inside `prims.$transaction`).
- [ ] **Webhook Verification**: Validate signatures from payment providers (Stripe/VNPAY/Momo) to prevent spoofing.

### 3. Data Privacy

- [ ] **PII**: Ensure passwords, credit card info, and tokens are NEVER logged (use `ClassSerializer` or manual masking).
- [ ] **IDOR**: Check that users can only access their own resources (Order, Profile). `where: { userId }` must be present.

### 4. File Upload

- [ ] **Validation**: Verify file types (`mimetype`) and magic bytes (if possible) to prevent executable uploads.
- [ ] **Rename**: Always rename uploaded files to random strings to prevent overwriting or executing known filenames.

## 🤖 Automated Checks

- **SAST**: GitHub CodeQL runs on every push. Check the "Security" tab.
- **Dependency Audit**: `npm audit` runs weekly.
- **AI Auditor**: mitigating "Vibe Coding" risks. Run `npx ts-node scripts/ai-audit.ts <file>` on complex logic.
