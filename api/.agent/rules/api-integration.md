# API Integration Rules

> Quy tắc khi tích hợp các dịch vụ bên thứ 3 (Payment, Shipping, AI, etc.)
> **Trạng thái:** BẮT BUỘC

## 1. Adapter Pattern (Bắt buộc)

Luôn sử dụng **Adapter Pattern** hoặc **Strategy Pattern** để bọc các 3rd party lib. Không gọi trực tiếp SDK của provider trong Service chính.

**Pattern:**

```
PaymentService → PaymentAdapter (Interface)
                  ├── VnPayAdapter (implements PaymentAdapter)
                  └── MomoAdapter (implements PaymentAdapter)
```

**Evidence:**

- `src/integrations/cloudinary/cloudinary.service.ts`
- `src/payment/adapters/` (nếu có)

**Code Example:**

```typescript
// Interface định nghĩa hợp đồng
export interface PaymentAdapter {
  createPayment(amount: number, orderId: string): Promise<PaymentUrl>;
  verifyCallback(data: any): Promise<PaymentResult>;
}

// Service inject adapter qua DI
@Injectable()
export class PaymentService {
  constructor(
    @Inject('PAYMENT_ADAPTER')
    private readonly adapter: PaymentAdapter,
  ) {}
}
```

## 2. Environment Variables (Bảo mật)

- **Rule:** Tuyệt đối KHÔNG hardcode API Keys, Secrets.
- **Khai báo:** Trong `.env` và validate bằng `Joi` trong `app.module.ts`.
- **Sử dụng:** Dùng `ConfigService` của NestJS để lấy giá trị.

**Evidence:** `src/core/config/constants.ts`

```typescript
// ✅ ĐÚNG
const apiKey = this.configService.get<string>('VNPAY_SECRET_KEY');

// ❌ SAI
const apiKey = 'hardcoded-secret-key-123';
```

**Required 3rd Party ENV vars:**

| Provider     | Env Variables                                                          |
| :----------- | :--------------------------------------------------------------------- |
| Cloudinary   | `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` |
| VNPay        | `VNPAY_TMN_CODE`, `VNPAY_SECRET_KEY`, `VNPAY_URL`                      |
| Momo         | `MOMO_PARTNER_CODE`, `MOMO_ACCESS_KEY`, `MOMO_SECRET_KEY`              |
| GHN Shipping | `GHN_TOKEN`, `GHN_SHOP_ID`                                             |
| Gemini AI    | `GEMINI_API_KEY`                                                       |

## 3. Error Handling (Quan trọng)

- **Bắt lỗi:** Wrap lỗi từ 3rd party vào `HttpException` của NestJS.
- **Logging:** Log chi tiết request payload và response body.
- **Timeout:** Luôn có timeout cho các external request (Default: 5000ms).

**Evidence:** `src/integrations/cloudinary/cloudinary.service.ts`

```typescript
try {
  const result = await cloudinary.uploader.upload(file, options);
  return result;
} catch (error) {
  this.logger.error('Cloudinary upload failed', {
    error: error.message,
    file: file.originalname,
  });
  throw new BadRequestException('Image upload failed. Please try again.');
}
```

**HTTP Client Config:**

```typescript
// Axios với timeout
this.httpService.post(url, data, {
  timeout: 5000, // 5 giây
  headers: { 'Content-Type': 'application/json' },
});
```

## 4. Webhook Handling (Critical)

- **Signature Verification:** Xác thực chữ ký cho MỌI Webhook request.
- **Idempotency:** Xử lý 1 request nhiều lần không gây lỗi (dùng `transactionId`).
- **Fast Response:** Respond `200 OK` ngay lập tức, xử lý logic sau (dùng Queue nếu nặng).

**Evidence:** `src/payment/webhooks/vnpay.webhook.ts` (nếu có)

```typescript
@Post('vnpay/ipn')
async handleVnPayIPN(@Body() body: VnPayIPNDto) {
  // 1. Verify signature NGAY
  const isValid = this.vnpayService.verifySignature(body);
  if (!isValid) {
    this.logger.warn('Invalid VNPay signature', { body });
    return { RspCode: '97', Message: 'Invalid signature' };
  }

  // 2. Check idempotency (đã xử lý chưa?)
  const existing = await this.paymentRepo.findByTransactionId(body.vnp_TxnRef);
  if (existing?.status === 'PAID') {
    return { RspCode: '02', Message: 'Already processed' };
  }

  // 3. Respond OK ngay, push job xử lý
  await this.paymentQueue.add('process-payment', { data: body });
  return { RspCode: '00', Message: 'Success' };
}
```

## 5. Retry Strategy

Khi gọi 3rd party thất bại, cần có chiến lược retry hợp lý:

- **Exponential Backoff:** 1s → 2s → 4s → 8s
- **Max Retries:** 3 lần
- **Circuit Breaker:** Nếu fail liên tục, ngừng gọi trong 30s

**Ví dụ với Axios:**

```typescript
import axiosRetry from 'axios-retry';

axiosRetry(this.httpService.axiosRef, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error) =>
    axiosRetry.isNetworkOrIdempotentRequestError(error) ||
    error.response?.status === 429, // Rate limited
});
```
