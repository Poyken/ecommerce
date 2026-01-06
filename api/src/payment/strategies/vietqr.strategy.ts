import { Injectable } from '@nestjs/common';
import {
  CreatePaymentDto,
  PaymentResult,
  PaymentStrategy,
} from '../interfaces/payment-strategy.interface';

/**
 * =================================================================================================
 * VIETQR STRATEGY - CHIẾN LƯỢC THANH TOÁN QUA MÃ QR CHUYỂN KHOẢN
 * =================================================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. DYNAMIC QR GENERATION:
 *    - Sử dụng dịch vụ `img.vietqr.io` để tạo link ảnh QR code động.
 *    - Không cần lưu trữ ảnh trên Server, chỉ cần tạo URL đúng định dạng là xong.
 *
 * 2. TRANSACTION MAPPING:
 *    - `addInfo` (nội dung chuyển khoản) cực kỳ quan trọng. Ta format là "THANHTOAN <ORDER_ID>".
 *    - Khi Webhook nhận dữ liệu từ Ngân hàng, nó sẽ dùng nội dung này để tìm đúng đơn hàng.
 *
 * 3. STRATEGY PATTERN:
 *    - Implement giao diện `PaymentStrategy`. Giúp hệ thống dễ dàng thêm các cổng thanh toán
 *      khác (Momo, VNPay, Stripe) mà không làm thay đổi code xử lý đơn hàng chính.
 * =================================================================================================
 */
@Injectable()
export class VietQrStrategy implements PaymentStrategy {
  processPayment(dto: CreatePaymentDto): Promise<PaymentResult> {
    // 1. Get configs from env (or use defaults for testing)
    const bankId = process.env.VIETQR_BANK_ID || 'MB'; // Default MB Bank
    const accountNo = process.env.VIETQR_ACCOUNT_NO || '0000000000'; // Mock account
    const template = process.env.VIETQR_TEMPLATE || 'compact';

    // 2. Generate content (addInfo)
    // Format: "THANHTOAN <ORDER_ID>"
    // Limit length and remove special chars to be safe
    const content = `THANHTOAN ${dto.orderId}`.replace(/[^a-zA-Z0-9 ]/g, '');

    // 3. Construct URL
    // Format: https://img.vietqr.io/image/<BANK_ID>-<ACCOUNT_NO>-<TEMPLATE>.png?amount=<AMOUNT>&addInfo=<CONTENT>&accountName=<NAME>
    const qrUrl = encodeURI(
      `https://img.vietqr.io/image/${bankId}-${accountNo}-${template}.png?amount=${dto.amount}&addInfo=${content}`,
    );

    return Promise.resolve({
      success: true,
      transactionId: `VQ-${Date.now()}`, // Temporary ID, real ID comes from Webhook
      paymentUrl: qrUrl,
      message: 'Vui lòng quét mã QR để thanh toán',
    });
  }
}
