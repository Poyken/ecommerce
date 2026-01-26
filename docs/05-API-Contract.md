# Tài liệu Hợp đồng API

## Nền tảng E-commerce Multi-tenant

---

### Thông tin tài liệu

**Phiên bản**: 1.0  
**Ngày**: 22 tháng 1, 2026  
**Tác giả**: Đội ngũ Phát triển  
**Trạng thái**: Bản nháp  
**Phiên bản API**: v1  
**URL Cơ sở**: `https://api.ecommerce.com/api/v1`

---

### Tổng quan về API

#### Nguyên tắc Kiến trúc

1. **Thiết kế RESTful**: Các phương thức HTTP và mã trạng thái phù hợp
2. **Hỗ trợ Multi-tenant**: Cách ly tenant qua headers hoặc subdomains
3. **Phiên bản hóa**: Dựa trên URL (`/api/v1/`)
4. **Phản hồi Nhất quán**: Định dạng phản hồi được tiêu chuẩn hóa
5. **Xử lý Lỗi**: Cơ chế báo lỗi chi tiết và toàn diện
6. **Giới hạn Tốc độ**: Giới hạn tần suất yêu cầu (Throttling) theo tenant và người dùng

#### Xác thực (Authentication)

```http
Authorization: Bearer <jwt_token>
X-Tenant-ID: <tenant_uuid>
```

#### Các Headers Tiêu chuẩn

```http
Content-Type: application/json
Accept: application/json
X-Request-ID: <correlation_id>
X-Client-Version: <client_version>
```

---

### Tiêu chuẩn Định dạng Phản hồi

#### Phản hồi Thành công

```typescript
interface ApiResponse<T> {
  data: T;
  meta: {
    total?: number;
    page?: number;
    limit?: number;
    hasNext?: boolean;
    hasPrev?: boolean;
  };
  links?: {
    self: string;
    first?: string;
    last?: string;
    next?: string;
    prev?: string;
  };
  timestamp: string;
  requestId: string;
}
```

#### Phản hồi Lỗi

```typescript
interface ApiError {
  error: {
    code: string;
    message: string;
    details?: any;
    field?: string;
    timestamp: string;
    path: string;
    requestId: string;
  };
}
```

#### Phản hồi Phân trang

```typescript
interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
```

---

### Các Endpoints Xác thực (Authentication)

#### POST /auth/register

Đăng ký tài khoản người dùng mới.

**Yêu cầu (Request Body):**

```typescript
interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  acceptTerms: boolean;
  marketingConsent?: boolean;
}
```

**Phản hồi (201):**

```typescript
interface RegisterResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    isActive: boolean;
    emailVerified: boolean;
    createdAt: string;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
}
```

**Mã lỗi thường gặp:**

- `EMAIL_ALREADY_EXISTS`: Email đã được đăng ký
- `INVALID_EMAIL`: Định dạng email không hợp lệ
- `WEAK_PASSWORD`: Mật khẩu không đáp ứng yêu cầu bảo mật
- `TERMS_NOT_ACCEPTED`: Phải chấp nhận các điều khoản sử dụng

#### POST /auth/login

Xác thực người dùng và nhận mã token.

**Yêu cầu (Request Body):**

```typescript
interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}
```

**Phản hồi (200):**

```typescript
interface LoginResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    permissions: string[];
    tenantId: string;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
}
```

**Mã lỗi thường gặp:**

- `INVALID_CREDENTIALS`: Email hoặc mật khẩu không đúng
- `ACCOUNT_LOCKED`: Tài khoản tạm thời bị khóa
- `ACCOUNT_INACTIVE`: Tài khoản chưa được kích hoạt
- `EMAIL_NOT_VERIFIED`: Địa chỉ email chưa được xác minh

#### POST /auth/refresh

Làm mới mã access token bằng mã refresh token.

#### POST /auth/logout

Đăng xuất người dùng và vô hiệu hóa các mã token.

---

### Các Endpoints Quản lý Người dùng

#### GET /users/profile

Lấy thông tin hồ sơ người dùng hiện tại.

**Yêu cầu Xác thực:** Bắt buộc  
**Phản hồi (200):** Thông tin chi tiết về người dùng.

#### PUT /users/profile

Cập nhật thông tin hồ sơ người dùng.

#### POST /users/change-password

Thay đổi mật khẩu người dùng.

#### GET /users

Danh sách người dùng (Chỉ dành cho Admin).

---

### Các Endpoints Quản lý Sản phẩm

#### GET /products

Danh sách sản phẩm với các bộ lọc và phân trang.

**Tham số truy vấn (Query Parameters):**

- `page`: Số trang (mặc định: 1)
- `limit`: Số lượng mục mỗi trang (mặc định: 20, tối đa: 100)
- `search`: Từ khóa tìm kiếm (tên, mô tả, SKU)
- `category`: Lọc theo ID danh mục
- `brand`: Lọc theo ID thương hiệu
- `status`: Lọc theo trạng thái (active, inactive, draft)
- `priceMin`: Giá tối thiểu
- `priceMax`: Giá tối đa
- `sortBy`: Trường sắp xếp (name, price, createdAt, sortOrder)
- `sortOrder`: Hướng sắp xếp (asc, desc)

#### GET /products/:id

Lấy thông tin chi tiết sản phẩm theo ID hoặc slug.

#### POST /products

Tạo sản phẩm mới (Chỉ dành cho Admin).

#### PUT /products/:id

Cập nhật thông tin sản phẩm (Chỉ dành cho Admin).

#### DELETE /products/:id

Xóa sản phẩm (Chỉ dành cho Admin - Xóa mềm).

---

### Các Endpoints Quản lý Danh mục

#### GET /categories

Danh sách danh mục theo cấu trúc phân cấp.

#### GET /categories/:id

Lấy thông tin chi tiết danh mục.

#### POST /categories

Tạo danh mục mới (Chỉ dành cho Admin).

---

### Các Endpoints Quản lý Giỏ hàng

#### GET /cart

Lấy thông tin giỏ hàng của người dùng hiện tại.

#### POST /cart/items

Thêm sản phẩm vào giỏ hàng.

#### PUT /cart/items/:id

Cập nhật số lượng sản phẩm trong giỏ hàng.

#### DELETE /cart/items/:id

Xóa sản phẩm khỏi giỏ hàng.

---

### Các Endpoints Quản lý Đơn hàng

#### GET /orders

Danh sách đơn hàng của người dùng với các bộ lọc.

#### GET /orders/:id

Lấy thông tin chi tiết đơn hàng.

#### POST /orders

Tạo đơn hàng từ giỏ hàng.

#### POST /orders/:id/cancel

Hủy đơn hàng.

---

### Các Endpoints Thanh toán

#### GET /payments/methods

Lấy danh sách các phương thức thanh toán khả dụng.

#### POST /payments/process

Xử lý thanh toán cho đơn hàng.

---

### Các Endpoints Tìm kiếm

#### GET /search/products

Tìm kiếm sản phẩm với các bộ lọc nâng cao.

#### GET /search/suggestions

Gợi ý từ khóa tìm kiếm.

#### GET /search/ai

Tìm kiếm ngữ nghĩa được hỗ trợ bởi AI.

---

### Các Endpoints Admin

#### GET /admin/dashboard

Lấy các số liệu thống kê bảng điều khiển.

#### GET /admin/analytics/sales

Phân tích dữ liệu bán hàng.

---

### Các Endpoints Webhook

#### POST /webhooks/payment

Xử lý các thông báo từ cổng thanh toán.

#### POST /webhooks/shipping

Xử lý các thông báo từ đơn vị vận chuyển.

---

### Bảng tra cứu Mã lỗi

#### Lỗi Xác thực & Phân quyền (4xx)

| Mã lỗi                     | HTTP | Mô tả                          |
| -------------------------- | ---- | ------------------------------ |
| `UNAUTHORIZED`             | 401  | Không có thông tin xác thực    |
| `INVALID_TOKEN`            | 401  | Token không lệ hoặc đã hết hạn |
| `INSUFFICIENT_PERMISSIONS` | 403  | Người dùng không đủ quyền hạn  |
| `ACCOUNT_LOCKED`           | 423  | Tài khoản đang bị khóa         |

#### Lỗi Xác thực Dữ liệu (4xx)

| Mã lỗi                   | HTTP | Mô tả                                   |
| ------------------------ | ---- | --------------------------------------- |
| `VALIDATION_ERROR`       | 400  | Dữ liệu yêu cầu không qua bước kiểm tra |
| `INVALID_INPUT`          | 400  | Dữ liệu đầu vào không hợp lệ            |
| `MISSING_REQUIRED_FIELD` | 400  | Thiếu trường thông tin bắt buộc         |

#### Lỗi Logic Nghiệp vụ (4xx)

| Mã lỗi               | HTTP | Mô tả                    |
| -------------------- | ---- | ------------------------ |
| `INSUFFICIENT_STOCK` | 400  | Không đủ hàng trong kho  |
| `CART_EXPIRED`       | 400  | Giỏ hàng đã hết hạn      |
| `PROMO_EXPIRED`      | 400  | Mã khuyến mãi đã hết hạn |

#### Lỗi Hệ thống (5xx)

| Mã lỗi                   | HTTP | Mô tả                            |
| ------------------------ | ---- | -------------------------------- |
| `INTERNAL_ERROR`         | 500  | Lỗi máy chủ nội bộ               |
| `DATABASE_ERROR`         | 500  | Lỗi thao tác cơ sở dữ liệu       |
| `EXTERNAL_SERVICE_ERROR` | 502  | Dịch vụ bên ngoài không phản hồi |

---

### Giới hạn Tốc độ (Rate Limiting)

| Loại Endpoint        | Giới hạn | Thời gian | Đối tượng áp dụng |
| -------------------- | -------- | --------- | ----------------- |
| Xác thực             | 10       | 1 phút    | IP                |
| Tìm kiếm             | 100      | 1 phút    | Người dùng        |
| Duyệt sản phẩm       | 1000     | 1 giờ     | Tenant            |
| Quản trị (Admin API) | 500      | 1 giờ     | Người dùng        |

---

### Chiến lược Phân phiên bản API

1. **Phân phiên bản qua URL**: `/api/v1/`, `/api/v2/`
2. **Phiên bản ngữ nghĩa (Semantic Versioning)**: Major.Minor.Patch
3. **Tính tương thích ngược**: Hỗ trợ phiên bản cũ tối thiểu 12 tháng
4. **Thông báo ngừng hỗ trợ**: Sử dụng các headers cảnh báo cho client

---

### Kiểm thử và Tài liệu

- **Kiểm thử Đơn vị (Unit Tests)**: Xác thực logic từng endpoint.
- **Kiểm thử Tích hợp (Integration Tests)**: Kiểm tra sự phối hợp giữa DB và các dịch vụ.
- **Tài liệu Tự động**: Sử dụng **OpenAPI/Swagger** được sinh tự động từ mã nguồn.

---

### Phê duyệt

**Kiến trúc sư API**: ********\_\_\_********  
**Ngày**: ********\_\_\_********  
**Chữ ký**: ********\_\_\_********

**Lập trình viên Trưởng**: ********\_\_\_********  
**Ngày**: ********\_\_\_********  
**Chữ ký**: ********\_\_\_********

**Trưởng nhóm QA**: ********\_\_\_********  
**Ngày**: ********\_\_\_********  
**Chữ ký**: ********\_\_\_********
