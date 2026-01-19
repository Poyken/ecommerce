# Business Flows Reference (Enterprise Edition)

Tài liệu này mô tả chi tiết các luồng nghiệp vụ của hệ thống Ecommerce 2.0 (Enterprise), tương ứng với `schema.prisma` mới.

---

## 1. Multi-Tenancy & Auth Flow

### 1.1 Tenant Resolution

Mọi Request tới API đều phải xác định Context Tenant:

1.  **Public Storefront**: Dựa vào `Host` Header (Subdomain hoặc Custom Domain).
    - `shop1.platform.com` -> Tenant A
    - `mystore.com` (CNAME) -> Tenant A
2.  **Platform Admin**: Dựa vào đường dẫn hoặc subdomain quản trị (`admin.platform.com`).
3.  **API Requests**:
    - Header `x-tenant-id`: Bắt buộc cho các tác vụ quản trị.
    - Nếu thiếu -> Trả về 400 (Bad Request).

### 1.2 Permission-based RBAC

Hệ thống sử dụng cơ chế kiểm soát quyền truy cập chi tiết (Granular Permission Checks):

- **Permission**: Đơn vị quyền nhỏ nhất (ví dụ: `order:read`, `product:create`, `tenant:manage`).
- **Role**: Tập hợp các Permissions (nhóm quyền). Ví dụ: `STAFF` có `order:read`, `product:read`.
- **Authorization Flow**:
  1. Login -> Server trả về Permission Set (gộp từ Roles + Direct Permissions).
  2. Guard (`@RequirePermissions`) kiểm tra quyền trước khi vào Controller.
  3. Frontend ẩn hiện nút bấm dựa trên Permission List.

### 1.3 Token Refresh & Security

Để đảm bảo an toàn và trải nghiệm liền mạch:

- **Access Token**: Short-lived (ví dụ 15 phút), lưu trong HTTP-Only Cookie.
- **Refresh Token**: Long-lived (ví dụ 7 ngày), lưu trong HTTP-Only Cookie (Rotation).
- **Auto-Refresh**:
  - Middleware (Server-Side) tự động kiểm tra và refresh token trước khi render trang bảo vệ.
  - Client-Side tự động retry request khi gặp lỗi 401 nhờ interceptor gọi qua Server Action proxy.

---

## 2. Catalog & Inventory (Advanced)

### 2.1 Product Variants & Options

Mô hình SKU-centric:

- **Product**: Chứa thông tin chung (Tên, Mô tả, Brand).
- **ProductOption**: Định nghĩa thuộc tính (Size, Color).
- **OptionValue**: Giá trị cụ thể (S, M, Red, Blue).
- **SKU**: Biến thể cụ thể (Product A - Red - S).
  - SKU liên kết N-N với `OptionValue`.
  - SKU có giá riêng (`price`, `originalPrice`, `costPrice`).

### 2.2 Inventory Management

Hỗ trợ Multi-Warehouse:

- Mỗi SKU có `InventoryItem` tại nhiều `Warehouse`.
- **InventoryLog**: Ghi lại mọi biến động kho (Purchase, Sale, Return, Adjustment).
- **Logic**:
  - `Available Stock` = `OnHand` - `Committed` (Đang nằm trong đơn chưa ship).
  - Khi order -> Tăng `Committed`.
  - Khi ship -> Giảm `OnHand`, Giảm `Committed`.

---

## 3. Order Processing & Fulfillment

### 3.1 Checkout Flow (Enterprise)

1.  **Cart Calculation**:
    - Tính tổng tiền hàng.
    - **Promotion Engine**: Check `PromotionRules` -> Apply `PromotionActions` (Discount Item, Discount Order, Free Shipping).
    - **Tax Engine**: Tính thuế theo `Region` và `TaxRate`.
    - **Tiered Pricing**: Nếu là B2B Customer, áp dụng giá từ `PriceList` thay vì giá niêm yết.
2.  **Place Order**:
    - Tạo `Order` (Status: PENDING).
    - Tạo `OrderLineItem` (Snapshot giá và discount tại thời điểm mua).
    - Khóa tồn kho (Inventory Commitment).
3.  **Payment**:
    - Tạo `Payment` record.
    - Tích hợp Stripe/PayPal/Momo.

### 3.2 Fulfillment & Shipping

- **Split Shipments**: Một Order có thể tách thành nhiều `Shipment` (Giao nhiều lần/từ nhiều kho).
- **Intelligent Routing**: Hệ thống tự động phân bổ Order Items vào các kho (Warehouse) tối ưu dựa trên tồn kho thực tế, ưu tiên dồn vào ít kho nhất để giảm chi phí vận chuyển.
- **Shipment Records**: Mỗi kho sẽ có một `Shipment` riêng, chứa danh sách `ShipmentItem` liên kết với `OrderItem`.

### 3.3 Returns (RMA)

- User request `ReturnRequest`.
- Admin duyệt -> `APPROVED`.
- Hàng về kho -> Update `InventoryLog` (Type: `RETURN`).
- Refund tiền -> Update `Wallet` hoặc hoàn tiền qua Gateway.

---

## 4. Marketing & Loyalty

### 4.1 Advanced Promotions

- **Loại hình Khuyến mãi**:
  - **Automatic**: Tự động áp dụng khi thỏa mãn điều kiện (Rules).
  - **Voucher/Coupon**: Phải nhập mã code chính xác để kích hoạt.
- **Điều kiện (Rules)**:
  - Giá trị đơn hàng tối thiểu (Min Order Value).
  - Áp dụng cho Sản phẩm/Danh mục/Thương hiệu cụ thể.
- **Hành động (Actions)**:
  - Giảm giá theo % (kèm mức giảm tối đa - Max Cap).
  - Giảm giá số tiền cố định.
  - Miễn phí vận chuyển (Free Shipping).
- **Cơ chế Ưu tiên (Priority)**:
  - Hệ thống tự động chọn Khuyến mãi có độ ưu tiên (Priority) cao nhất và giá trị giảm lớn nhất để áp dụng, tránh việc cộng dồn sai quy định.
- **Giới hạn sử dụng (Usage Limit)**:
  - Mỗi Khuyến mãi có tổng giới hạn lượt dùng và được lưu log chi tiết trong bảng `PromotionUsage`.

### 4.2 Loyalty System

- **Earning**: Tỷ lệ tích điểm cấu hình theo `TenantSettings`.
- **Tier**: Hạng thành viên (Silver, Gold) dựa trên tổng chi tiêu.
- **Redemption**: Dùng điểm đổi voucher hoặc trừ trực tiếp vào đơn hàng.

---

## 5. AI & Automation (RAG)

### 5.1 AI Chat Assistant

- **Embedding**: Sync Product/Blog data vào Vector DB (pgvector) qua bảng `ProductEmbedding`.
- **Flow**:
  1.  User hỏi "Tìm giày chạy bộ màu đỏ dưới 1 triệu".
  2.  System embed query -> Search pgvector.
  3.  LLM rerank kết quả -> Trả lời User.
  4.  Lưu history vào `AiChatSession` và `AiChatMessage`.

### 5.2 Insight & Analytics

- Phân tích hành vi User qua `UserBehaviorLog`.
- Gợi ý sản phẩm (Recommendation Engine).

---

## 6. Subscription (SaaS for Tenant)

- **SubscriptionPlan**: Gói dịch vụ (Free, Pro, Enterprise).
- **Subscription**: Tenant đăng ký gói.
- **Limits**: Giới hạn số lượng Product, Staff, Storage theo gói.
- **Billing**: Thu phí Tenant định kỳ.

---

## 7. Notification & Real-time Alerts

### 7.1 Architecture

- **Protocol**: WebSocket (Socket.IO) kết hợp với REST API polling.
- **Gateway**: `NotificationsGateway` quản lý kết nối real-time, authenticate qua Token (Handshake Auth/Header/Cookie).
- **Fallback**: Client fetch API `/notifications` để lấy lịch sử và trạng thái unread khi mới load trang.

### 7.2 Notification Flow

1. **Trigger Event**: Các sự kiện hệ thống (Order Update, Loyalty Tier Change, Promotion) gọi `NotificationsService`.
2. **Persist**: Lưu thông báo vào bảng `Notification` (Postgres) với trạng thái `isRead: false`.
3. **Dispatch**:
   - Nếu User đang online (kết nối Socket): Gateway bắn event `notification:new` trực tiếp tới user room. Client hiển thị Toast/Badge ngay lập tức.
   - Nếu User offline: Thông báo vẫn được lưu trong DB. Khi User online lại, Client fetch list mới nhất.
4. **Interaction**:
   - User click Bell Icon -> Xem list.
   - User click "Mark as Read" -> Call API `PATCH` -> Update DB -> Giảm Unread Count.

---

## 8. Global Expansion (Phase 24)

### 8.1 Internationalization (i18n)

- **Frontend (`next-intl`)**:
  - Routing: `/[locale]/protected-page`. Locale được lấy từ URL.
  - Fallback: Tự động detect qua `Accept-Language` và Redirect.
  - Persistence: Locale được lưu trong Cookie để Server-side component truy cập.
- **Backend (`nestjs-i18n`)**:
  - Resolver: Ưu tiên `Accept-Language` header -> Query Param `lang`.
  - Content: Thông báo lỗi từ `GlobalExceptionFilter` được dịch tự động.

### 8.2 Multi-currency Support

- **Storage**: `useCurrency` (Zustand + Persist) lưu loại tiền tệ khách chọn.
- **Conversion**: Áp dụng tỉ giá cố định (Sandbox) hoặc gọi API bên thứ 3 để convert giá từ Base Currency (VND) sang Display Currency.
- **Display**: Component `<Price />` xử lý logic format (VND: `100.000₫`, USD: `$4.00`).
