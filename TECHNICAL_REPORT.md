# Dự án: Command Center Ecommerce - Technical Audit & Deep Report

## 1. Tổng quan Kiến trúc (High-Level Architecture)

Dự án được xây dựng trên mô hình **Monorepo (giả lập)** với 2 folder chính: `api` (NestJS) và `web` (Next.js 16 App Router). Hệ thống sử dụng Multi-tenancy dựa trên `tenantId` và DB PostgreSQL (Prisma).

### Điểm mạnh:

- Sử dụng **Feature-based structure** trong folder `features/`, giúp module hóa logic nghiệp vụ.
- Layer bảo mật tốt với `next-safe-action` và RBAC (Dựa trên Permission).
- Hiệu năng tốt nhờ Server Components và Caching nâng cao.

### Điểm yếu & Nợ kỹ thuật:

- **Redundancy (Dư thừa)**: Tồn tại quá nhiều layer chồng chéo (`services`, `actions`, `domain-actions`).
- **Inconsistency (Không đồng nhất)**: Có sự lẫn lộn giữa cấu trúc `(auth)` và `auth`, `(shop)` vs các root routes khác.
- **Legacy Code**: Nhiều files trong `web/lib` và `web/data` được tạo ra từ lúc boilerplate chưa hoàn thiện.

---

## 2. Chi tiết Audit & Đề xuất Tái cấu trúc

### 2.1. Thư mục `web/lib` (Dọn dẹp & Tiêu chuẩn hóa)

- **Tình trạng**: Quá nhiều file helper nhỏ lẻ.
- **Giải pháp**: Hợp nhất `safe-action.ts` và `safe-action-utils.ts`. Xóa bỏ `result.ts`. Gom các hooks thuần UI vào `hooks/` thay vì để rải rác.

### 2.2. Thư mục `web/components` (Review Structure)

- **Hiện tại**: Hầu hết để trong `shared` hoặc top-level.
- **Đề xuất (Atomic + Feature)**:
  - `@/components/ui`: Chỉ chứa Shadcn cơ bản.
  - `@/components/shared`: Chứa các phân tử UI dùng chung như `GlassCard`, `Logo`.
  - `@/features/*/components`: Chứa UI đặc thù của feature đó (vd: `ProductCard`).
  - `@/components/layouts`: Chứa Shared Layouts (Navbar, Footer).

### 2.3. Dòng chảy Dữ liệu (Services vs Actions)

- **Action**: Chỉ dùng cho thay đổi trạng thái (POST/PUT/DELETE) thông qua `next-safe-action`.
- **Service**: Chỉ dùng cho việc fetch data (GET) từ API, hỗ trợ caching. Toàn bộ `web/services` được đưa về `features/*/services`.

### 2.4. SEO & Công cụ tìm kiếm (`manifest.ts`, `robots.ts`, `sitemap.ts`)

- **Backend Sync**: Hiện tại các file này là static hoặc dynamic dựa trên logic frontend.
- **Đề xuất**: `sitemap.ts` nên gọi trực tiếp API `productService.getProductIds()` để generate routes động thực tế từ DB mỗi khi Google crawl.

---

## 3. Lộ trình Triển khai Tiếp theo (Roadmap)

1. **Giai đoạn 1: Cleanup & Library Optimization (HOÀN THÀNH ✅)**:
   - Xóa bỏ hoàn toàn: `web/services`, `web/actions`, `web/data`, `web/lib/result.ts`, `web/lib/api-helpers.ts`.
   - Hợp nhất `utils.ts` và `format.ts`.
   - Loại bỏ `PerformanceTracker` và các dependencies không dùng (`web-vitals`).
   - Chuẩn hóa Authentication routes và SEO (Favicon, Sitemap).
2. **Giai đoạn 2: Refine Component Architecture (HOÀN THÀNH ✅)**:
   - Áp dụng Atomic Design cho `web/components/shared`.
   - Di chuyển các logic-heavy components (`SmartWidget`, `ReviewItem`, `PurchaseToast`) từ `shared` sang `features`.
   - Phân loại 47+ components của Admin Dashboard vào cấu trúc thư mục rõ ràng (`dialogs`, `ui`, `navigation`).
   - Tối ưu hóa Skeletons bằng cách colocation vào từng feature.
   - Loại bỏ các UI primitives dư thừa (Consolidate `ProgressiveImage` vào `OptimizedImage`).
3. **Giai đoạn 3: Trải nghiệm Thanh toán & Dashboards (Đang thực hiện)**:
   - Loại bỏ Simulation page, tích hợp direct checkout.
   - Kết nối Real Data cho Super Admin Stats.
4. **Giai đoạn 4: Polish & Premium Aesthetics**:
   - Tinh chỉnh các micro-animations trên toàn hệ thống.
   - Xây dựng hệ thống Asset Management chuyên nghiệp.

---

_Báo cáo được chuẩn bị bởi Antigravity AI - System Architect._
