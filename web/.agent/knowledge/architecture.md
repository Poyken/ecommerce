# Web Architecture Patterns

> **Framework**: Next.js 15+ (App Router)  
> **Styling**: TailwindCSS 4 + Shadcn UI  
> **State**: Server Actions + SWR (Client-side)

---

## 1. Core Principles

### 1.1 Server-First Approach

Hệ thống ưu tiên xử lý dữ liệu tại Server để đảm bảo SEO và Performance:

- **Server Components (RSC)**: Luôn dùng RSC để fetch dữ liệu thô (Catalog, Product Detail).
- **Server Actions**: Duy nhất dùng Server Actions cho toàn bộ mutations (POST, PUT, DELETE). Sử dụng `next-safe-action` để wrapper validation và auth checks.

### 1.2 Multi-Tenant URL Routing

Mọi route đều nằm trong dynamic segment `[locale]`:

- URL Structure: `/[locale]/[tenant-slug]/...`
- **Tenant Resolution**: Server-side middleware/layout kiểm tra Hostname hoặc Slug để inject đúng `tenantId` vào context.

---

## 2. Advanced Data Fetching

### 2.1 SWR for Client-Side Interactivity

SWR được dùng khi cần UI phản ứng nhanh mà không chờ Server revalidation:

- **Cart & Wishlist**: Sử dụng Optimistic Updates qua SWR.
- **Live Filtering**: Kết hợp `nuqs` (URL state management) với SWR để filter sản phẩm mượt mà không load lại trang.

### 2.2 Revalidation Strategy

- **Time-based**: ISR (Incremental Static Regeneration) cho các trang Listing (~60s).
- **On-demand**: Gọi `revalidatePath` hoặc `revalidateTag` trong Server Action sau khi Admin cập nhật sản phẩm.

---

## 3. Component Architecture

### 3.1 Design System (Shadcn/UI)

- **Theme Adaptation**: Toàn bộ component sử dụng CSS variables (`--primary`, `--primary-foreground`) để tự động thích ứng với Brand Color của từng Tenant.
- **Neo-Brutalism & Glassmorphism**: Phối hợp các yếu tố đổ bóng mạnh (borders) và nền mờ (backdrop-blur) để tạo cảm giác cao cấp.

### 3.2 Form Handling

- **Library**: `react-hook-form` + `zod`.
- **Validation**: Shared Zod schemas giữa API và Web để đảm bảo tính nhất quán dữ liệu.

---

## 4. Auth & Security

### 4.1 Cross-Domain Session

- **Cookie-based**: JWT Access & Refresh tokens được lưu trữ trong HTTP-Only Cookies.
- **Middleware Guard**: Kiểm tra session tại Vercel Edge để redirect user chưa đăng nhập trước khi render page.

### 4.2 Permission Handling

Sử dụng custom hook `usePermissions()` hoặc server-side check `checkPermission(user, 'order:read')` để ẩn/hiện UI elements dựa trên RBAC.

---

## 5. Performance Targets

- **Bundle Size**: Giữ Core bundle < 100kb (gzip) bằng cách dùng `dynamic-imports` cho các module nặng (Charts, Rich Text Editor).
- **Priority Loading**: Hero images LUÔN có thuộc tính `priority`.

---

**Philosophy**: _Don't just build a shop, build a scalable commerce engine._
