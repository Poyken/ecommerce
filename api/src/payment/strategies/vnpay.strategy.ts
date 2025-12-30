import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as querystring from 'qs';
import {
  CreatePaymentDto,
  PaymentResult,
  PaymentStrategy,
} from '../interfaces/payment-strategy.interface';
import { VNPayUtils } from '../vnpay.utils';

/**
 * =====================================================================
 * VNPAY STRATEGY - CHIẾN LƯỢC THANH TOÁN QUA VNPAY
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. SECURE HASH (Chữ ký số):
 * - Đây là phần quan trọng nhất. Mọi tham số gửi đi phải được sắp xếp A-Z, sau đó dùng thuật toán HMAC-SHA512 với Secret Key để tạo chữ ký.
 * - VNPay dùng chữ ký này để đảm bảo dữ liệu không bị thay đổi trên đường truyền (Integrity).
 *
 * 2. CURRENCY SCALE:
 * - VNPay yêu cầu số tiền gửi đi phải nhân với 100 (đơn vị minor). Ví dụ: 10,000đ -> gửi 1000000.
 *
 * 3. TMN CODE & SECRET KEY:
 * - `TmnCode` là mã định danh website của mình trên VNPay.
 * - `SecretKey` dùng để tạo chữ ký. TUYỆT ĐỐI không được để lộ key này ở phía Client.
 * =====================================================================
 */
@Injectable()
export class VNPayStrategy implements PaymentStrategy {
  private readonly logger = new Logger(VNPayStrategy.name);

  constructor(private readonly configService: ConfigService) {}

  private maskIP(ip: string): string {
    if (!ip) return 'unknown';
    const parts = ip.split('.');
    if (parts.length < 4) return '***.***.***.***';
    return `${parts[0]}.${parts[1]}.***.***`;
  }

  processPayment(dto: CreatePaymentDto): Promise<PaymentResult> {
    this.logger.log(`Processing payment for order ${dto.orderId}`, {
      amount: dto.amount,
      ipAddr: this.maskIP(dto.ipAddr || ''),
    });
    const tmnCode = this.configService.get('VNPAY_TMN_CODE');
    const secretKey = this.configService.get('VNPAY_HASH_SECRET');
    const vnpUrl =
      this.configService.get('VNPAY_URL') ||
      'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
    const returnUrl =
      dto.returnUrl || this.configService.get('VNPAY_RETURN_URL');

    if (!tmnCode || !secretKey) {
      throw new Error('VNPAY configuration missing');
    }

    const date = new Date();
    const createDate = this.formatDate(date);
    const orderId = dto.orderId;
    // VNPay amount is multiplied by 100 (VND integer)
    const amount = dto.amount * 100;

    // IP Address is required
    const ipAddr = dto.ipAddr || '127.0.0.1';

    const vnp_Params: any = {};
    vnp_Params['vnp_Version'] = '2.1.0';
    vnp_Params['vnp_Command'] = 'pay';
    vnp_Params['vnp_TmnCode'] = tmnCode;
    vnp_Params['vnp_Locale'] = 'vn';
    vnp_Params['vnp_CurrCode'] = 'VND';
    vnp_Params['vnp_TxnRef'] = orderId;
    vnp_Params['vnp_OrderInfo'] =
      dto.orderDescription || `Thanh toan don hang ${orderId}`;
    vnp_Params['vnp_OrderType'] = 'other';
    vnp_Params['vnp_Amount'] = amount;
    vnp_Params['vnp_ReturnUrl'] = returnUrl;
    vnp_Params['vnp_IpAddr'] = ipAddr;
    vnp_Params['vnp_CreateDate'] = createDate;

    // Sorting parameters alphabetically
    const sortedParams = VNPayUtils.sortObject(vnp_Params);

    // Create query string
    const signData = querystring.stringify(sortedParams, { encode: false });

    // Create Secure Hash
    const signed = VNPayUtils.generateSignature(secretKey, signData);

    vnp_Params['vnp_SecureHash'] = signed;

    // Final URL
    const finalUrl =
      vnpUrl + '?' + querystring.stringify(vnp_Params, { encode: false });

    return Promise.resolve({
      success: true,
      paymentUrl: finalUrl,
      message: 'Redirect to VNPay',
    });
  }

  // Helper to format date YYYYMMDDHHmmss
  private formatDate(date: Date): string {
    const fn = (n: number) => (n < 10 ? '0' + n : n.toString());
    return (
      date.getFullYear() +
      fn(date.getMonth() + 1) +
      fn(date.getDate()) +
      fn(date.getHours()) +
      fn(date.getMinutes()) +
      fn(date.getSeconds())
    ).toString();
  }
}
