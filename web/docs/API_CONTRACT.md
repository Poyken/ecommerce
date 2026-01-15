# 📄 Tài Liệu Quy Chuẩn Giao Tiếp API (API Contract)

Tài liệu này định nghĩa cách thức hệ thống Web giao tiếp với Backend, quy tắc định nghĩa kiểu dữ liệu và các tiêu chuẩn bảo mật dữ liệu.

## 1. Định Nghĩa Kiểu Dữ Liệu (`web/types/api.ts`)

Mọi giao tiếp dữ liệu phải tuân thủ các interface chuẩn hóa để đảm bảo tính an toàn kiểu (Type Safety).

### 🔹 ApiResponse (Cấu trúc Response chuẩn)

Mọi dữ liệu trả về từ API thành công sẽ được bọc trong wrapper:

```typescript
export interface ApiResponse<T> {
  statusCode: number; // Mã trạng thái HTTP (2xx)
  message: string; // Thông báo mô tả kết quả
  data: T; // Dữ liệu chính nhận được
  meta?: PaginationMeta; // Dữ liệu phân trang (nếu có)
}
```

### 🔹 ActionResult (Xử lý trong Server Actions)

Sử dụng cho logic phía Server của Next.js để trả về kết quả cho Client:

```typescript
export type ActionResult<T = void> =
  | { success: true; data?: T; meta?: PaginationMeta; error?: never }
  | { success?: false; error: string; data?: never; meta?: never };
```

_Lợi ích: Giúp tách biệt rõ ràng luồng dữ liệu thành công và lỗi mà không cần lặp lại khối try-catch ở UI._

---

## 2. HTTP Client Utility (`lib/http.ts`)

Hệ thống cung cấp hàm `http` thay thế cho `fetch` thông thường với các tính năng nâng cao:

### Cơ chế Hoạt động:

1.  **Server-only Fetching:** Chỉ chạy trên môi trường Server để bảo vệ logic và token.
2.  **Auth Interceptor:** Tự động đọc cookie `accessToken` và gắn vào header `Authorization: Bearer <token>`.
3.  **Security Headers:** Tự động đính kèm `X-CSRF-Token` và `X-Tenant-Domain`.
4.  **Deduplication:** Trên Client, các request GET trùng URL trong một khoảng thời gian ngắn sẽ được gộp lại để tối ưu hóa băng thông.

### Ví dụ sử dụng:

```typescript
// Lấy dữ liệu với phân trang
const response = await http<ApiResponse<Order[]>>("/orders", {
  params: { page: 1, limit: 10 },
});

// Gửi dữ liệu (POST)
const result = await http("/orders", {
  method: "POST",
  body: JSON.stringify(orderData),
});
```

---

## 3. Quản Lý Lỗi (Error Handling)

Lỗi được xử lý tập trung để cung cấp trải nghiệm nhất quán:

- **401 Unauthorized:** Hệ thống tự động xóa token và điều hướng người dùng về trang `/login`.
- **Validation Errors (400/422):** Thông báo lỗi từ Backend được parse và hiển thị chi tiết cho từng field thông qua React Hook Form.
- **Server Errors (500):** Hiển thị thông báo chung chung "Something went wrong" để bảo mật thông tin hệ thống, nhưng log chi tiết thông tin lỗi cho nhà phát triển.

---

## 4. Bảo Mật và Xác Thực

### Header Tiêu chuẩn:

- `Authorization`: Chứa JWT Token cho các API cần quyền truy cập.
- `X-CSRF-Token`: Phòng chống tấn công giả mạo yêu cầu từ phía máy khách chéo.
- `X-Tenant-Domain`: Giúp hệ thống định danh Store dựa trên tên miền đang truy cập.

### Lưu trữ Session:

- Sử dụng **HTTP-only Cookie** để lưu trữ Token, ngăn chặn các cuộc tấn công XSS truy cập trực tiếp vào Token.
- Thời gian hết hạn của Session được quản lý bởi cả Client (Cookie expiry) và Server (JWT expiry).

---

📅 _Cập nhật lần cuối: 13/01/2026_
