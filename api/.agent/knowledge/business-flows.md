# Business Flows Reference (Enterprise Edition)

Tài liệu này mô tả chi tiết các luồng nghiệp vụ của hệ thống Ecommerce 2.0 (Enterprise), được đồng bộ từ logic thực tế trong mã nguồn (`api/src`).

---

## 1. Multi-Tenancy & Auth Flow

### 1.1 Tenant Resolution Ecosystem

Hệ thống hoạt động theo mô hình 4-Tier Resolution để định tuyến request:

1.  **Platform / Marketing** (`localhost:3000`):
    - **Mục đích**: Landing Page giới thiệu, Bảng giá, và Luồng đăng ký Tenant mới.
    - **Resolution**: Host là root domain (ví dụ `luxesaas.com` hoặc `localhost`). Không có `tenantId`.
2.  **Tenant Demo** (`demo.localhost:3000`):
    - **Mục đích**: Môi trường trải nghiệm cho khách hàng với dữ liệu mẫu (Seeded Data).
    - **Resolution**: Host có subdomain `demo`. `tenantId` trỏ về Tenant Demo mặc định.
3.  **Tenant Store** (`<slug>.localhost:3000`):
    - **Mục đích**: Cửa hàng hoạt động của Tenant (Storefront & Admin).
    - **Resolution**:
      - **Subdomain**: Nhận diện qua slug (ví dụ `noithat`).
      - **Custom Domain**: Lookup từ bảng `Tenants` (ví dụ `noithat.com` -> `tenant_id_123`).
4.  **Auth System**:
    - **Mục đích**: Login/Register tập trung nhưng phân quyền theo Tenant (Context-aware).

**Cơ chế thực thi**:

- `TenantMiddleware` trích xuất thông tin host và lookup trong Redis/DB để gán `tenantId` vào `AsyncLocalStorage`.
- Nếu không tìm thấy Tenant hợp lệ cho request dạng store -> Trả về 404.

### 1.2 Permission-based RBAC & Security

Hệ thống sử dụng cơ chế kiểm soát quyền truy cập phân lớp (Layered Security):

- **RBAC Engine**:
  - **Permission**: Đơn vị quyền nguyên tử (ví dụ: `order:read`, `product:create`, `tenant:manage`).
  - **Role**: Nhóm các quyền (ví dụ: `STAFF`, `MERCHANT`). `Superadmin` có quyền bypass mọi kiểm tra.
- **Security Guards**:
  - `AppThrottlerGuard`: Chống brute-force và spam request.
  - `TenantGuard`: Chặn truy cập trái phép chéo tenant.
  - `LockdownGuard`: Chế độ bảo trì hệ thống.
  - `@RequirePermissions`: Kiểm tra quyền truy cập tinh vi tại cấp độ Controller/Method.

### 1.3 Token Refresh & Security

Để đảm bảo an toàn và trải nghiệm liền mạch:

- **Auth Strategy**: JWT dual-token (Access & Refresh).
- **Security Features**:
  - **HTTP-Only Cookies**: Chống tấn công XSS.
  - **Refresh Token Rotation**: Mỗi lần refresh sẽ cấp một Refresh Token mới, vô hiệu hóa token cũ -> Chống chiếm quyền điều khiển phiên (Session Hijacking).
- **Auto-Refresh Flow**: Interceptor phía Frontend tự động gọi Server Action proxy để refresh token khi gặp lỗi 401, giúp trải nghiệm người dùng không bị gián đoạn.

---

## 2. Catalog & Inventory (Advanced)

### 2.1 Product Variants & Options (SKU-centric)

- **Hierarchy**: `Product` -> `ProductOption` -> `OptionValue` -> `SKU`.
- **Data Integrity**: SKU là đơn vị bán hàng cuối cùng, sở hữu các thuộc tính riêng như `skuCode`, `price`, `stock`, và định danh N-N với `OptionValue`.
- **Pricing Strategy**: Hỗ trợ `originalPrice` (giá niêm yết) và `price` (giá bán thực tế), tự động tính toán % giảm giá hiển thị trên Storefront.

### 2.2 Inventory Management (Atomic & Multi-warehouse)

Hệ thống quản lý kho hàng với độ chính xác cao nhờ cơ chế **Atomic Updates**:

- **Mô hình Tồn kho**:
  - `OnHand Stock`: Số lượng thực trong kho.
  - `Reserved Stock`: Số lượng đã được giữ cho các đơn hàng chưa hoàn tất.
  - `Available Stock` (trường `stock` trong DB): Số lượng khách có thể mua. Công thức: `Available = OnHand - Reserved`.
- **Atomic Operations**:
  - **Đặt hàng**: `UPDATE Sku SET stock = stock - N, reservedStock = reservedStock + N WHERE stock >= N`.
  - **Hủy đơn**: Hoàn trả tồn kho (`releaseStock`).
  - **Hoàn tất (Completed)**: Trừ `reservedStock` vĩnh viễn.
- **Traceability**: Mọi biến động đều được ghi vào `InventoryLog` kèm `reason` và `userId` để đối soát (Audit trail).

---

## 3. Order Processing & Fulfillment

### 3.1 Checkout Flow (Serializable Transaction)

Luồng tạo đơn hàng được thực thi trong một **Database Transaction** với mức cô lập `Serializable` (cao nhất) để chống Race Condition:

1.  **Validation**: Kiểm tra giỏ hàng, tính khả dụng của SKU (Active) và địa chỉ giao hàng.
2.  **Atomic Reservation**: Giữ tồn kho bằng Atomic Update. Nếu kho không đủ -> Rollback toàn bộ transaction ngay lập tức.
3.  **Promotion Engine**: Validate mã giảm giá, kiểm tra các Rule (GTE, LTE, Category, First Order) và thực hiện Action (Discount, Gift). Tăng `usedCount` một cách nguyên tử.
4.  **Pricing Snapshot**: Lưu `priceAtPurchase` và `skuNameSnapshot` (ví dụ: "Sofa Da (Đỏ - L)") vào `OrderItem` để bảo toàn dữ liệu lịch sử khi Master Data thay đổi.
5.  **Shipping calculation**: Tích hợp API `GHNService` để tính phí vận chuyển real-time hoặc fallback về `TenantSettings`.
6.  **Transactional Outbox**: Ghi event vào bảng `OutboxEvent` (ví dụ: `ORDER_CREATED`) để đảm bảo các tác vụ phụ (Gửi Email/Noti) được thực thi một cách tin cậy (Guaranteed Delivery).

### 3.2 Fulfillment & Shipping (Webhook Integration)

- **Carrier Integration**: Sử dụng Giao Hàng Nhanh (GHN) làm đối tác chính qua `ShippingService`.
- **Webhook Workflow**: Hệ thống tự động update trạng thái đơn hàng dựa trên tín hiệu từ nhà vận chuyển:
  - `picked/delivering` -> `SHIPPED`.
  - `delivered` -> `DELIVERED`.
  - `cancel` -> `CANCELLED` (Hoàn trả tồn kho tự động).
- **Customer Notification**: Mỗi bước thay đổi trạng thái đều kích hoạt thông báo real-time qua WebSocket (`NotificationsGateway`) và Email.

### 3.3 Returns (RMA)

- Luồng xử lý: `PENDING` -> `APPROVED` -> `RECEIVED` -> `REFUNDED`.
- Khi nhận hàng hoàn (Status `RECEIVED`): Tự động khôi phục tồn kho qua `InventoryService.releaseStock`.

---

## 4. Marketing & Loyalty

### 4.1 Advanced Promotion Engine (Rule-Action Model)

- **Rule Evaluation**: Kiểm tra các điều kiện phức tạp (giá trị đơn tối thiểu, nhóm khách hàng VIP, sản phẩm cụ thể) sử dụng toán tử so sánh (GT, LT, EQ).
- **Execution Actions**:
  - `DISCOUNT_PERCENT`: Giảm theo % (có `maxDiscountAmount`).
  - `DISCOUNT_FIXED`: Giảm số tiền cụ thể.
  - `FREE_SHIPPING`: Miễn phí ship cho đơn thỏa điều kiện.
  - `GIFT`: Tự động thêm SKU quà tặng vào đơn hàng.
- **Usage Control**: Giới hạn lượt dùng tổng (`usageLimit`) và lượt dùng trên mỗi User.

### 4.2 Loyalty System

- **Earning Logic**: Tích điểm dựa trên `totalAmount` của đơn hàng hoàn tất theo tỷ lệ cấu hình của Tenant.
- **Redemption**: Điểm thưởng được quản lý tập trung tại `LoyaltyService`, cho phép khách hàng dùng điểm để chi trả cho đơn hàng (Redeem).

---

## 5. AI & Automation (RAG Model)

### 5.1 AI Chat Assistant (Consultant Workflow)

Hệ thống sử dụng Gemini AI với mô hình **RAG (Retrieval-Augmented Generation)**:

1.  **Retrieval Step**: Trích xuất keyword từ câu hỏi người dùng -> Tìm kiếm Full-text Search trong Catalog để lấy Context (Giá, Tồn kho, Mô tả SP).
2.  **Augmentation Step**: Chèn Context vào System Prompt kèm theo các chính sách của cửa hàng (Freeship, Đổi trả).
3.  **Generation Step**: AI đóng vai tư vấn viên chuyên nghiệp, cung cấp thông tin chính xác từ DB.
4.  **Smart Features**: AI tự động tạo link QuickView `(quickview:productId)` giúp khách hàng xem chi tiết và mua hàng ngay trong khung chat.

### 5.2 Search & Insights

- Sử dụng **pgvector** cho tìm kiếm ngữ nghĩa (Semantic Search) bổ trợ cho Full-text search truyền thống.
- Nhật ký hành vi (`UserBehaviorLog`) hỗ trợ gợi ý sản phẩm cá nhân hóa.

---

## 6. SaaS Billing & Management

- **Tenant Onboarding**: Quy trình đăng ký cửa hàng, chọn gói dịch vụ (`SubscriptionPlan`) và cấu hình ban đầu.
- **Limit Enforcement**: Hệ thống kiểm soát số lượng sản phẩm, nhân viên dựa trên gói dịch vụ của Tenant.
- **Audit Logs**: Lưu trữ nhật ký hoạt động quản trị, hỗ trợ phân vùng dữ liệu theo tháng (`partitioned by month`) để tối ưu hiệu suất.

---

## 7. Notification & Real-time Alerts

Hệ thống thông báo đẩy (Push Notification) hoạt động theo cơ chế Single Source of Truth:

1.  **Trigger**: Logic nghiệp vụ gọi `NotificationsService.create()`.
2.  **Persistence**: Lưu vào DB (Postgres) -> Trạng thái `isRead: false`.
3.  **Real-time Dispatch**: `NotificationsGateway` phát tín hiệu qua WebSocket tới phòng (room) riêng của User.
4.  **Fallback**: Nếu User offline, thông báo sẽ được hiển thị ngay khi User đăng nhập lại qua API polling.

---

## 8. Global Expansion (Phase 24)

### 8.1 Internationalization (i18n)

- **Backend**: `nestjs-i18n` xử lý dịch các thông báo lỗi và email templates dựa trên locale của request.
- **Frontend**: `next-intl` quản lý đa ngôn ngữ qua URL segment (ví dụ: `/vi/shop/tenant-1`).

### 8.2 Financial Standards

- **Multi-currency**: Chuyển đổi giá tự động qua component `<Price />` dựa trên tỉ giá cấu hình (VND là base currency).
- **Money Handling**: Xử lý tiền tệ là số nguyên (Integer) hoặc dùng thư viện `Decimal` (Prisma) để tránh lỗi làm tròn của kiểu Float trong Javascript.
