# Tài liệu API

## Nền tảng E-commerce Multi-tenant

---

### Thông tin tài liệu

**Phiên bản**: 1.0  
**Ngày**: 22 tháng 1, 2026  
**Phiên bản API**: v1  
**URL Cơ sở**: `https://api.ecommerce-platform.com/v1`

---

### Tổng quan về API

#### Nguyên tắc thiết kế

1. **RESTful Design**: Tuân thủ các tiêu chuẩn REST và phương thức HTTP (GET, POST, PUT, DELETE).
2. **Hỗ trợ Đa người thuê (Multi-tenant)**: Phân tách dữ liệu khách hàng qua headers hoặc subdomains.
3. **Phiên bản hóa (Versioning)**: Luôn đi kèm phiên bản trên URL để đảm bảo tính tương thích (ví dụ: `/v1/`).
4. **Chuẩn hóa Phản hồi**: Cấu trúc JSON nhất quán cho cả trường hợp thành công và lỗi.

#### Các môi trường

- **Phát triển**: `http://localhost:8080/v1`
- **Staging**: `https://staging-api.ecommerce-platform.com/v1`
- **Sản xuất**: `https://api.ecommerce-platform.com/v1`

---

### Xác thực & Ủy quyền (Authentication)

- **JWT Bearer Token**: Gửi token qua header `Authorization: Bearer <token>`.
- **Định danh Tenant**: Bắt buộc gửi `X-Tenant-ID` trong header hoặc qua subdomain.
- **API Key**: Dành cho các tích hợp hệ thống bên thứ ba.

---

### Cấu trúc Phản hồi chuẩn

#### Khi thành công (Success)

```json
{
  "success": true,
  "data": { ... },
  "meta": { "timestamp": "...", "requestId": "..." },
  "pagination": { "page": 1, "limit": 20, "total": 100 }
}
```

#### Khi có lỗi (Error)

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Mô tả lỗi chi tiết",
    "details": []
  }
}
```

---

### Các Endpoint chính

#### 1. Tài khoản & Xác thực

- `POST /auth/register`: Đăng ký tài khoản mới.
- `POST /auth/login`: Đăng nhập và nhận token.
- `POST /auth/refresh`: Làm mới access token.

#### 2. Sản phẩm (Products)

- `GET /products`: Danh sách sản phẩm (có phân trang, lọc theo danh mục, giá, thương hiệu).
- `GET /products/{id}`: Chi tiết một sản phẩm.
- `POST /products`: Tạo sản phẩm mới (chỉ dành cho Admin).

#### 3. Giỏ hàng & Đơn hàng

- `GET /cart`: Xem giỏ hàng hiện tại.
- `POST /cart/items`: Thêm sản phẩm vào giỏ.
- `POST /orders`: Tạo đơn hàng mới và thanh toán.
- `GET /orders/{id}`: Kiểm tra trạng thái đơn hàng và thông tin vận chuyển.

#### 4. Tìm kiếm thông minh (AI Search)

- `POST /search/semantic`: Tìm kiếm sản phẩm bằng ngôn ngữ tự nhiên sử dụng AI.

---

### Webhooks

- Hỗ trợ gửi thông báo thời gian thực cho các sự kiện: `order.created`, `payment.completed`, `inventory.low`.
- Mọi webhook đều có chữ ký (Signature) để đảm bảo tính xác thực.

---

### Phê duyệt

**Trưởng nhóm Phát triển API**: ********\_\_\_********  
**Kiến trúc sư giải pháp**: ********\_\_\_********  
**Quản lý dự án**: ********\_\_\_********
