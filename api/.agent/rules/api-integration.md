# Api Integration Rules

> Quy tắc khi tích hợp các dịch vụ bên thứ 3 (Payment, Shipping, AI, etc.)

## 1. Adapter Pattern

Luôn sử dụng **Adapter Pattern** hoặc **Strategy Pattern** để bọc các 3rd party lib. Không gọi trực tiếp SDK của provider trong Service chính.

**Ví dụ:**

- `PaymentService` gọi `PaymentAdapter` (Interface).
- `VnPayAdapter` và `MomoAdapter` implement `PaymentAdapter`.

## 2. Environment Variables

- Tuyệt đối KHÔNG hardcode API Keys, Secrets.
- Khai báo trong `.env` và validate bằng `Joi` trong `app.module.ts`.
- Sử dụng `ConfigService` để lấy giá trị.

## 3. Error Handling

- Bắt lỗi từ 3rd party và wrap vào `HttpException` của NestJS.
- Log chi tiết lỗi (request payload, response body) để debug.
- Luôn có timeout cho các external request (Default: 5000ms).

## 4. Webhooks

- Xác thực chữ ký (Signature Verification) cho mọi Webhook request.
- Xử lý Webhook phải Idempotent (Một request xử lý nhiều lần không gây lỗi).
- Respond `200 OK` ngay lập tức để tránh Provider retry liên tục, sau đó xử lý logic (dùng Queue nếu nặng).
