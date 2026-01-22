/**
 * =====================================================================
 * PAYMENT INTERFACES - Các giao diện cho hệ thống thanh toán
 * =====================================================================
 *
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
