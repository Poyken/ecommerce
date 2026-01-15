# Security Rules & Guards

> **Context:** NestJS Guards, Throttler, Helmet, CSRF.
> **Status:** STRICT

## 1. Authentication Layer (Who are you?)

- **Access Token:** JWT (Short-lived 15m). Verify via `JwtAuthGuard`.
- **Refresh Token:** JWT (Long-lived 7d). Stored in Redis whitelist.
- **Rule:** Tất cả Private API bắt buộc phải có `@UseGuards(JwtAuthGuard)`.

## 2. Authorization Layer (What can you do?)

Dự án sử dụng **RBAC** (Role-Based Access Control) + **Stateless Permissions**.

- **Mechanism:** Quyền (vd: `product:create`) được gán cứng vào Payload của Access Token.
- **Usage:**
  ```typescript
  @UseGuards(PermissionsGuard)
  @Permissions('product:create')
  create(@Body() dto: CreateDto) { ... }
  ```
- **Rule:** KHÔNG check quyền thủ công trong Service. Sử dụng Decorator `@Permissions` tại Controller.

## 3. Rate Limiting (Anti-Spam)

Sử dụng `ThrottlerModule` với Redis Storage.

| Scope      | Limit   | Window | config key          |
| :--------- | :------ | :----- | :------------------ |
| **Global** | 100 req | 60s    | `RATE_LIMIT_GLOBAL` |
| **Auth**   | 5 req   | 60s    | `RATE_LIMIT_AUTH`   |
| **Admin**  | 50 req  | 60s    | `RATE_LIMIT_ADMIN`  |

**Rule:** Với API nhảy cảm (OTP, Login), phải override limit mặc định:

```typescript
@Throttle({ default: { limit: 3, ttl: 60000 } })
login() { ... }
```

## 4. CSRF Protection (Anti-Forgery)

- **Guard:** `CsrfGuard`.
- **Mechanism:** Double Submit Cookie.
- **Scope:** Áp dụng cho mọi method thay đổi dữ liệu (`POST`, `PUT`, `DELETE`, `PATCH`).
- **Exclusion:** Public Routes (Login, Register) và Webhooks (Payment, Shipping).

## 5. Emergency Lockdown

- **Guard:** `LockdownGuard`.
- **Feature:** `SYSTEM_LOCKDOWN` (Feature Flag).
- **Behavior:** Khi bật, toàn bộ API trả về 503 Service Unavailable, TRỪ:
  - Super Admin (Verify qua JWT Role).
  - Auth Routes (Login để Admin vào fix).
  - Health Checks.

## 6. Security Header (Helmet)

Content Security Policy (CSP) được cấu hình chặt chẽ trong `constants.ts`:

- `scriptSrc`: Chỉ cho phép `'self'`. (TODO: Remove `'unsafe-inline'` after Swagger refactor).
- `connectSrc`: Whitelist domain VNPay, MoMo.
