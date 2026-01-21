# Web Infrastructure Reference

> **Purpose**: Operational and architectural requirements for the Next.js storefront.  
> **Target**: Frontend Architects / DevOps  
> **Core Pattern**: App Router + Server Actions + SWR (Client Caching)

---

## 1. Build & Runtime

- **Framework**: Next.js 15+ (App Router).
- **Runtime**: Node.js 20+ (Ideal) or Edge Runtime (for specific routes).
- **Output Mode**: `standalone` (for Docker optimization).

---

## 2. Rendering Strategy

Hệ thống tận dụng Hybrid Rendering để tối ưu SEO và Performance:

- **SSG (Static Site Generation)**: Cho các trang tĩnh như Landing, About, Contact.
- **ISR (Incremental Static Regeneration)**: Cho Product Listing & Detail. Tự động revalidate khi có thay đổi từ Admin.
- **SSR (Server-Side Rendering)**: Cho các trang cần User Context (Profile, Checkout, Admin).

---

## 3. Multi-Tenant Resolution

Frontend nhận diện Tenant thông qua Context layer:

1. **URL-based**: Nhận diện qua Subdomain (`tenant-a.domain.com`) hoặc Custom Domain.
2. **Server-side Lookup**: Server Action kiểm tra Hostname và lookup Tenant ID tương ứng.
3. **Locale Injection**: URL luôn có cấu trúc `/[locale]/[path]` (ví dụ: `/vi/home`).

---

## 4. Networking & Domain Configuration

### 4.1 Custom Domains

Hệ thống hỗ trợ ánh xạ domain riêng. DNS yêu cầu:

- **A Record**: Trỏ về IP của cụm Front-end (ví dụ Vercel Edge).
- **CNAME**: Mapping cho `www` và các subdomains.

### 4.2 API Communication

- Giao tiếp với API thông qua Proxy hoặc gọi trực tiếp dựa trên `NEXT_PUBLIC_API_URL`.
- JWT Tokens được lưu trữ trong **HTTP-Only Cookies** để bảo mật tối đa.

---

## 5. SEO & Core Web Vitals

Mọi thay đổi hạ tầng phải đảm bảo:

- **LCP** < 2.5s (Sử dụng `next/image` và `priority`).
- **CLS** < 0.1 (Reserve space cho dynamic components).
- **FID** < 100ms (Reduce JS bundle size).

---

## 6. Implementation Example: Vercel

- **Framework Preset**: Next.js
- **Root Directory**: `web`
- **Output Directory**: `.next`
- **Build Command**: `npm run build`

---

**Next**: [seo-optimization-guide.md](file:///home/mguser/ducnv/ecommerce-main/web/.agent/knowledge/seo-optimization-guide.md)
