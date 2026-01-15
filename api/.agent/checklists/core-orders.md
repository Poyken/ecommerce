# Core Logic Checklist: Orders & Payment

> **Domain:** E-commerce Order Processing
> **Complexity:** HIGH (Transactions, 3rd Party Integration, Background Jobs)
> **Key Files:** `src/orders/orders.service.ts`, `src/orders/orders.controller.ts`, `src/payment/payment.service.ts`

## 1. Create Order Flow (Critical Path)

Logic `orders.service.ts` -> `create()`:

- [ ] **Transaction Atomicity:**
  - Mọi thao tác (Validate Stock, Create Order, Deduct Stock, Clear Cart, Save Outbox Event) **PHẢI** nằm trong cùng 1 `prisma.$transaction`.
  - Isolation Level: `Serializable` (Để tránh Race Condition khi check tồn kho).
- [ ] **Inventory Validation:**
  - Check `sku.status === 'ACTIVE'`.
  - Check `sku.stock >= item.quantity`.
  - **Lưu ý:** Lấy giá ($) từ DB (`sku.price`), KHÔNG lấy từ Client gửi lên.
- [ ] **Coupon Logic:**
  - Validate: `startDate`, `endDate`, `usageLimit`.
  - **Security:** Mã `WELCOME-*` phải check đúng owner (người được tặng).
  - Tính toán: `Math.min(discount, maxDiscountAmount)`.
  - **Atomic Update:** `increment: 1` vào `usedCount`.
- [ ] **Reliability (Outbox Pattern):**
  - Không gọi Queue/Email trực tiếp sau khi DB commit.
  - **Phải** lưu event vào bảng `OutboxEvent` (`ORDER_CREATED`) ngay trong transaction.

## 2. Order Status Transition

Logic `updateStatus()`:

- [ ] **State Machine Validation:**
  - `PENDING` -> `PROCESSING` / `CANCELLED` (OK)
  - `PROCESSING` -> `SHIPPED` (OK)
  - `SHIPPED` -> `DELIVERED` (OK)
  - **Cấm:** Đi ngược (vd: `DELIVERED` -> `PENDING`).
  - **Cấm:** Nhảy cóc (vd: `PENDING` -> `DELIVERED`).
- [ ] **Integrity Checks:**
  - Không được chuyển sang `PROCESSING` nếu Payment chưa `PAID` (trừ COD).
  - Hủy đơn (`CANCELLED`) phải hoàn lại tồn kho (`inventoryService.releaseStock`).
  - Hủy đơn phải đồng bộ hủy bên GHN (`shippingService.cancelOrder`).

## 3. Payment Integration

- [ ] **Amount Matching:**
  - Số tiền gửi sang VNPay/Momo phải khớp 100% với `order.totalAmount`.
- [ ] **Idempotency:**
  - Webhook IPN (Instant Payment Notification) có thể gọi nhiều lần -> Check `transactionId` trước khi update.
  - Checksum/Signature verification là **BẮT BUỘC**.

## 4. Edge Cases (Must Test)

- [ ] **Race Condition:** 2 user cùng mua món hàng cuối cùng cùng lúc -> Chỉ 1 người thành công, người kia lỗi `Out of stock`.
- [ ] **Coupon Abuse:** User dùng tool spam 100 request áp mã giảm giá cùng lúc.
- [ ] **Payment Timeout:** User thanh toán xong nhưng không redirect về shop (Webtắt) -> Check IPN Webhook xử lý nền.
- [ ] **GHN Fail:** GHN API chết khi đang tạo đơn -> Fallback fee shipping (đã có logic default 30k).
