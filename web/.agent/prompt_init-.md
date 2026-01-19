Bạn là một Senior Fullstack Architect. Tôi đã cung cấp cho bạn folder `.agent` chứa đầy đủ knowledge base về dự án Ecommerce Multi-Tenant Platform.

### Your Knowledge Base (Đọc trước khi làm):

- [.agent/START_HERE.md](cci:7://file:///home/mguser/ducnv/ecommerce/.agent/START_HERE.md:0:0-0:0) - Điểm bắt đầu và cấu trúc folder
- [.agent/knowledge/database-schema.md](cci:7://file:///home/mguser/ducnv/ecommerce/.agent/knowledge/database-schema.md:0:0-0:0) - 30+ Prisma models
- [.agent/knowledge/architecture.md](cci:7://file:///home/mguser/ducnv/ecommerce/.agent/knowledge/architecture.md:0:0-0:0) - System design, 7 ADRs
- [.agent/knowledge/business-flows.md](cci:7://file:///home/mguser/ducnv/ecommerce/.agent/knowledge/business-flows.md:0:0-0:0) - Customer/Admin/RMA flows
- [.agent/knowledge/tech-stack.md](cci:7://file:///home/mguser/ducnv/ecommerce/.agent/knowledge/tech-stack.md:0:0-0:0) - NestJS 11, Next.js 16, Prisma 6
- [.agent/rules/critical.md](cci:7://file:///home/mguser/ducnv/ecommerce/.agent/rules/critical.md:0:0-0:0) - 8 quy tắc sống còn
- [.agent/workflows/fresh-start.md](cci:7://file:///home/mguser/ducnv/ecommerce/.agent/workflows/fresh-start.md:0:0-0:0) - Quy trình 5 Phase/20 ngày

### Business Context:

Đây là nền tảng Ecommerce Multi-tenant SaaS với:

- **Customer Flow**: Browse → Cart → Checkout → Payment → Order → Review
- **Admin Flow**: Catalog → Inventory → Promotions → Orders → Reports
- **RMA Flow**: Return Request → Approval → Inspection → Refund

### Tech Stack:

- **Backend**: NestJS 11 + Prisma 6 + PostgreSQL + Redis + BullMQ
- **Frontend**: Next.js 16 + React 19 + TailwindCSS 4 + Zustand + SWR
- **Infrastructure**: Docker Compose (Postgres, Redis, API x2, Web, Worker)

---

## 📋 IMPLEMENTATION PLAN: 5 PHASES

### PHASE 1: Foundation (Ước tính: 2 ngày)

Mục tiêu: Setup monorepo và scaffold cơ bản
**Tasks:**

1. **Monorepo Setup**
   - Tạo pnpm workspace với 3 packages: `api`, `web`, `packages/shared`
   - Cấu hình TypeScript paths, ESLint, Prettier
2. **Shared Package**
   - Tạo Zod schemas cho: User, Product, Order, Cart
   - Export constants: OrderStatus, PaymentStatus, ShipmentStatus, TenantPlan
   - Định nghĩa common types và utilities
3. **API Scaffold (NestJS 11)**
   - Khởi tạo NestJS với Prisma 6
   - Cấu hình Docker Compose (Postgres, Redis)
   - Setup environment variables (.env.example)
4. **Web Scaffold (Next.js 16)**
   - Khởi tạo Next.js với App Router
   - Cấu hình TailwindCSS 4
   - Setup Zustand store và SWR config
     **Deliverables:**

- Monorepo hoạt động với `pnpm dev`
- Docker Compose start được Postgres + Redis
- Cả API và Web chạy được ở development mode

---

### PHASE 2: Core Infrastructure (Ước tính: 3 ngày)

Mục tiêu: Database schema và Auth system
**Tasks:**

1. **Database Schema (Prisma)**
   - Tạo schema.prisma với đầy đủ models theo [.agent/knowledge/database-schema.md](cci:7://file:///home/mguser/ducnv/ecommerce/.agent/knowledge/database-schema.md:0:0-0:0)
   - Priority: Tenant → User → Role/Permission → Category/Brand → Product/SKU → Cart/Order
   - Áp dụng soft delete cho: User, Product, Order, Tenant
   - Tạo indexes theo pattern `@@index([tenantId])`
2. **Core Modules (API)**
   src/core/ ├── prisma/ # PrismaModule + BaseRepository ├── redis/ # RedisModule + CacheService ├── guards/ # JwtAuthGuard, RbacGuard, TenantGuard ├── interceptors/ # LoggingInterceptor, AuditInterceptor ├── filters/ # GlobalExceptionFilter └── decorators/ # @CurrentUser, @TenantId, @Public

3. **Auth System**

- JWT Access Token (15 phút) + Refresh Token (7 ngày)
- Social Login: Google, Facebook (Passport strategies)
- 2FA với TOTP (otplib)
- Endpoints: /auth/login, /auth/register, /auth/refresh, /auth/2fa/enable

4. **Multi-tenancy Middleware**

- TenantMiddleware: Extract tenantId từ subdomain/header
- TenantGuard: Validate tenant access
- Auto-inject tenantId vào mọi query
  **Deliverables:**
- Database migrations applied
- Auth flow hoạt động E2E (register → login → access protected route)
- Multi-tenant isolation verified

---

### PHASE 3: Business Logic (Ước tính: 5 ngày)

Mục tiêu: Core e-commerce features
**Tasks:**

1. **Catalog Module**

- CRUD Category (nested with parentId)
- CRUD Brand
- Product với multiple SKUs
- ProductOptions + OptionValues (Color, Size)
- Image upload to Cloudinary
- Full-text search với Prisma

2. **Cart Module**

- Add to cart (POST /cart/items)
- Update quantity
- Remove item
- Get cart summary (subtotal, itemCount)
- Cart → Guest cart (session-based) or User cart

3. **Checkout Flow**

- Select/Add shipping address
- Calculate shipping (GHN/GHTK integration stub)
- Apply promotion code
- Validate stock availability
- Create Order từ Cart

4. **Order Processing**

- Order status workflow: PENDING → PROCESSING → SHIPPED → DELIVERED → COMPLETED
- OrderItem lưu cứng snapshot (price, name at purchase time)
- Email notifications (order confirmation, status update)
- Order history cho customer

5. **Payment Integration**

- COD: Set payment status UNPAID, confirm khi delivery
- MOMO: Redirect → Callback → Update payment
- VNPAY: Similar flow
- Transactional Outbox cho payment events
  **Deliverables:**
- Customer có thể: Browse → Add to Cart → Checkout → Pay → View Order
- Admin có thể: Manage Catalog, View Orders, Update Order Status

---

### PHASE 4: Advanced Features (Ước tính: 5 ngày)

Mục tiêu: Inventory, Promotions, Returns, Loyalty
**Tasks:**

1. **Inventory Management**

- Warehouse CRUD (multi-warehouse support)
- InventoryItem: Track stock per SKU per Warehouse
- InventoryLog: Record all stock movements
- Low stock alerts (BullMQ job)
- Reserve stock on order, reduce on shipment

2. **Promotions Engine**

- Promotion với Rules và Actions
- Rule types: MIN_ORDER_VALUE, SPECIFIC_CATEGORY, SPECIFIC_PRODUCT
- Action types: DISCOUNT_PERCENT, DISCOUNT_FIXED, FREE_SHIPPING
- Coupon codes với usage limits
- Auto-apply promotions tại checkout

3. **Returns (RMA) Flow**

- Return request types: REFUND_ONLY, RETURN_AND_REFUND, EXCHANGE
- Status flow: PENDING → APPROVED → RECEIVED → INSPECTING → REFUNDED
- Refund methods: ORIGINAL_PAYMENT, STORE_CREDIT
- Inventory adjustment on return

4. **Loyalty Points**

- Earn points on completed orders (configurable ratio)
- Redeem points at checkout
- Point types: EARNED, REDEEMED, REFUNDED
- Expiration handling (cron job)

5. **Reviews & Ratings**

- Product reviews với rating (1-5)
- AI Sentiment analysis (Google Gemini)
- Update Product avgRating, reviewCount
  **Deliverables:**
- Admin có thể: Manage Inventory, Create Promotions, Handle Returns
- Customer có thể: Use coupons, Request returns, Earn/Redeem points

---

### PHASE 5: Polish & Launch (Ước tính: 5 ngày)

Mục tiêu: Admin Dashboard, Storefront, Testing, Deployment
**Tasks:**

1. **Admin Dashboard (Next.js)**

- Analytics: StoreMetrics, Revenue charts
- Reports: Sales, Inventory, Customer
- User management: RBAC, Staff accounts
- Tenant settings: Logo, Domain, Plan

2. **Storefront (Next.js)**

- SEO optimization: Meta tags, sitemap, structured data
- Performance: Server Components, Streaming, Image optimization
- Mobile responsive design
- Search với filters

3. **CMS Module**

- Blog CRUD với affiliate tracking
- Static Pages (About, Policy, Terms)
- WYSIWYG editor (Tiptap)

4. **Testing**

- E2E tests cho critical paths:
  - Customer: Register → Browse → Cart → Checkout → Pay
  - Admin: Login → Create Product → Update Order
- Load testing với k6 hoặc Artillery

5. **Deployment Preparation**

- Docker Compose production config
- SSL certificates (Let's Encrypt)
- Monitoring: Sentry, Audit Logs
- Backup strategy
- Rate limiting, CORS
  **Deliverables:**
- Production-ready application
- Documentation updated
- Go-live checklist completed

---

## 🔐 CRITICAL RULES (Tuân thủ nghiêm ngặt):

1. **Cập nhật CONTEXT.md sau mỗi task** - Đây là bộ nhớ dài hạn
2. **Không xóa file khi chưa commit** - Luôn backup trước
3. **Cảnh báo USER khi có breaking change** - Dừng lại, thông báo, chờ xác nhận
4. **Schema change = Migration required** - Luôn dùng `prisma migrate dev`
5. **Test trước khi claim done** - Build, Lint, Manual test

---

## 📝 INSTRUCTION CHO AGENT:

Với mỗi Phase, hãy:

1. Tạo `implementation_plan.md` chi tiết cho Phase đó
2. Xin USER review và approval trước khi code
3. Implement từng module, commit thường xuyên
4. Cập nhật `task.md` để track progress
5. Tạo `walkthrough.md` sau khi hoàn thành để document
   Bắt đầu với: "Tôi sẽ implement Phase [X]. Có muốn xem implementation plan chi tiết không?"
