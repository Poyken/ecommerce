/**
 * =====================================================================
 * PAYMENT INTERFACES - Các giao diện cho hệ thống thanh toán
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. CONTRACT-FIRST DESIGN:
 * - Interface đóng vai trò là một bản hợp đồng. Bất kỳ phương thức thanh toán mới nào cũng phải tuân thủ các interface này.
 * - Giúp code linh hoạt, dễ dàng mở rộng thêm VNPay, Momo, v.v. mà không cần sửa code cũ.
 *
 * 2. DATA TRANSFER OBJECT (DTO):
 * - `CreatePaymentDto`: Định nghĩa các thông tin cần thiết để thực hiện một giao dịch.
 * - `PaymentResult`: Định nghĩa cấu trúc kết quả trả về, giúp frontend xử lý đồng nhất (VD: hiển thị thông báo hoặc chuyển hướng URL).
 *
 * 3. ABSTRACTION:
 * - `PaymentStrategy`: Interface chính chứa hàm `processPayment`. Đây là cốt lõi của Strategy Pattern, cho phép ta gọi hàm thanh toán mà không cần biết cụ thể nó là loại nào. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Tiếp nhận request từ Client, điều phối xử lý và trả về response.

 * =====================================================================
 */
export interface CreatePaymentDto {
  amount: number;
  orderId: string;
  orderDescription?: string;
  // Các trường cụ thể cho các cổng khác nhau (ví dụ: token cho Stripe, returnUrl cho VNPay)
  paymentToken?: string;
  returnUrl?: string;
  ipAddr?: string;
}

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  paymentUrl?: string; // Cho chuyển hướng (VNPay, Momo)
  message?: string;
  rawResponse?: any;
}

export interface PaymentStrategy {
  processPayment(dto: CreatePaymentDto): Promise<PaymentResult>;
}
