import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import * as querystring from 'qs';
import {
  CreatePaymentDto,
  PaymentResult,
  PaymentStrategy,
} from '../interfaces/payment-strategy.interface';

@Injectable()
export class VNPayStrategy implements PaymentStrategy {
  constructor(private readonly configService: ConfigService) {}

  async processPayment(dto: CreatePaymentDto): Promise<PaymentResult> {
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
    const sortedParams = this.sortObject(vnp_Params);

    // Create query string
    const signData = querystring.stringify(sortedParams, { encode: false });

    // Create Secure Hash
    const hmac = crypto.createHmac('sha512', secretKey);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    vnp_Params['vnp_SecureHash'] = signed;

    // Final URL
    const finalUrl =
      vnpUrl + '?' + querystring.stringify(vnp_Params, { encode: false });

    return {
      success: true,
      paymentUrl: finalUrl,
      message: 'Redirect to VNPay',
    };
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

  // Sort object keys
  private sortObject(obj: any): any {
    const sorted: Record<string, string> = {};
    const str: string[] = [];
    let key;
    for (key in obj) {
      if (obj.hasOwnProperty(key)) {
        str.push(encodeURIComponent(key));
      }
    }
    str.sort();
    for (key = 0; key < str.length; key++) {
      sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, '+');
    }
    return sorted;
  }
}
