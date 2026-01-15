# 🧠 Project Context: api (Ecommerce Backend)

> Cập nhật cuối: 2026-01-15 - Trạng thái: **Active Development** with Agentic Brain

## 1. 🎯 Tổng quan & Nghiệp vụ (Domain)

- **Mục đích:** Xây dựng hệ thống Backend E-commerce mạnh mẽ, hỗ trợ Multi-tenancy (nhiều cửa hàng trên cùng 1 hệ thống), tích hợp sẵn các công cụ AI (Chatbot, Image Enhancement) và quy trình xử lý đơn hàng hoàn chỉnh.
- **Business Logic:**
  - **Happy Path (Mua hàng):** User (Guest/Member) -> Tìm kiếm (Semantic Search) -> Thêm vào giỏ -> Checkout (Tính phí ship, giảm giá) -> Thanh toán (VNPay/Momo) -> Order Created -> Inventory Deducted -> Notification gửi về User.
  - **Happy Path (Tenant):** Merchant đăng ký -> Tạo cửa hàng (Tenant) -> Quản lý sản phẩm/đơn hàng riêng biệt -> Xem báo cáo doanh thu.
- **User Persona:**
  - **Shopper:** Người mua hàng cuối (bảo mật thấp, cần UI nhanh).
  - **Merchant (Tenant Admin):** Chủ cửa hàng thuê platform (quản lý kho, đơn, báo cáo).
  - **Super Admin:** Quản trị viên hệ thống (quản lý tenants, subscriptions, global settings).

## 2. 🛠️ Hệ sinh thái Công nghệ (Tech Stack)

| Layer             | Technologies          | Usage & Evidence                                    |
| :---------------- | :-------------------- | :-------------------------------------------------- |
| **Runtime**       | **Node.js 20-alpine** | `Dockerfile`, `package.json`                        |
| **Framework**     | **NestJS 11**         | `src/main.ts` (Entry point)                         |
| **Language**      | TypeScript 5.7+       | `tsconfig.json`                                     |
| **Database**      | **PostgreSQL 15**     | `docker-compose.yml`, `prisma/schema.prisma`        |
| **ORM**           | **Prisma 6.19**       | `src/core/prisma/prisma.service.ts`                 |
| **Cache/Queue**   | **Redis 7**           | `src/core/redis/redis.module.ts`                    |
| **Job Queue**     | **BullMQ 5**          | `src/worker/worker.module.ts`                       |
| **WebSockets**    | Socket.IO             | `src/notifications/notifications.gateway.ts`        |
| **AI Engine**     | Google Gemini         | `src/ai-chat/gemini.service.ts`                     |
| **Cloud Storage** | Cloudinary            | `src/integrations/cloudinary/cloudinary.service.ts` |

## 3. 🏗️ Kiến trúc Hệ thống

- **Pattern:** **Modular Monolith** với kiến trúc **Controller-Service-Repository** (dùng Prisma Client trực tiếp thay vì Repository class thủ công).
- **Architecture Style:** NestJS standard dependency injection tree.
- **Data Flow:**
  `Request` -> `Global Middleware` (Helmet, RateLimit) -> `Guards` (Auth, Permissions) -> `Interceptors` (Logging, Transform) -> `Controller` -> `Service` (Business Logic) -> `Prisma` (DB Access) -> `Response`.
- **Key Files:**
  - `src/main.ts`: Bootstrap, Global Pipes/Filters/Interceptors.
  - `src/app.module.ts`: Root module, wiring tất cả components.
  - `src/core/filters/all-exceptions.filter.ts`: Centralized Error Handling.
  - `prisma/schema.prisma`: Data Model definition.

## 4. 📂 Quy hoạch Thư mục (Project Anatomy)

- `src/core/`: **Core Infrastructure**. Chứa logic dùng chung KHÔNG phụ thuộc vào nghiệp vụ cụ thể (Guards, Interceptors, Config, Prisma, Redis).
- `src/common/`: **Shared Utilities**. Các utility functions, decorators business-agnostic.
- `src/auth/`: **Authentication Domain**. Xử lý Login, Register, JWT, Permissions.
- `src/modules/` (ngầm hiểu): Các thư mục ngang hàng trong `src` (products, orders, users, tenants) đóng vai trò là Business Modules.
- `src/worker/`: **Background Workers**. Xử lý jobs từ Queue (Email, Image processing).
- `src/integrations/`: **External Services**. Code giao tiếp bên thứ 3 (Cloudinary, Email).
- `.agent/`: **Project Brain**. Chứa Rules, Checklists, Workflows, Skills giúp AI tự động hóa công việc.

## 5. 🚥 Trạng thái & Lộ trình (Development Status)

- [x] **Core System:** Auth (JWT+RBAC), Database Schema, Prisma setup, Docker env.
- [x] **Product Catalog:** Categories, Brands, SKUs, Products (Standard & Semantic Search).
- [x] **Order Flow:** Cart, Orders, Basic Payment structures.
- [/] **Multi-tenancy:** Schema đã support (`tenantId`), Middleware (`TenantMiddleware`) đã có, nhưng logic phân tách dữ liệu ở Application layer có thể chưa hoàn chỉnh 100%.
- [/] **AI Features:** Gemini integration setup (`ai-chat`, `rag`), Insights module setup.
- [/] **Notification:** Gateway setup (WebSocket), Email setup.
- [x] **Promotions:** Basic CRUD setup via Agent Workflow.
- [ ] **Billing/Subscription:** Code base cho Subscription (`tenants` module) có dấu hiệu khởi tạo nhưng cần kiểm tra tính hoàn thiện.

_Note: Trạng thái dựa trên file analysis, không phải runtime test._

## 6. 🚧 Technical Debt & Known Issues

- **TODOs detected:**
  - `src/notifications/notifications.controller.ts`: Cần hoàn thiện logic filter thông báo.
  - `src/orders/orders.controller.ts`: Logic xử lý phức tạp cần refactor hoặc thêm test case.
  - `src/core/config/constants.ts`: Cần review các hằng số hardcode.
- **Complexity:**
  - Hệ thống Permission "Hybrid" (Direct + Role) phức tạp, cần chú ý khi dev feature mới để tránh lỗ hổng bảo mật.
  - Logic `SKU` và `Product` tách biệt (Base vs Variant) đòi hỏi query cẩn thận khi lấy chi tiết sản phẩm.

## 7. ⚙️ Cấu hình & Vận hành

- **Env Vars (Critical):**
  - `DATABASE_URL`: Postgres Connection String.
  - `REDIS_URL`: Redis Connection.
  - `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET`: Security Keys.
  - `CLOUDINARY_*`: Image storage credentials.
  - `GEMINI_API_KEY`: AI Feature key.
- **Commands:**
  - `npm run start:dev`: Chạy Development server (watch mode).
  - `npx prisma migrate dev`: Cập nhật DB schema (Local).
  - `npm run test`: Chạy Unit tests.
  - `docker compose up -d`: Dựng toàn bộ hạ tầng (DB, Redis, API).
