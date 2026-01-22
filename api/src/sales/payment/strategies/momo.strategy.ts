import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import * as crypto from 'crypto';
import {
  CreatePaymentDto,
  PaymentResult,
  PaymentStrategy,
} from '../interfaces/payment-strategy.interface';

/**
 * =====================================================================
 * MOMO STRATEGY - CHIẾN LƯỢC THANH TOÁN QUA VÍ MOMO
 * =====================================================================
 *
 * =====================================================================
 */
@Injectable()
export class MoMoStrategy implements PaymentStrategy {
  private readonly logger = new Logger(MoMoStrategy.name);

  constructor(private readonly configService: ConfigService) {}

  async processPayment(dto: CreatePaymentDto): Promise<PaymentResult> {
    const partnerCode = this.configService.get('MOMO_PARTNER_CODE');
    const accessKey = this.configService.get('MOMO_ACCESS_KEY');
    const secretKey = this.configService.get('MOMO_SECRET_KEY');
    const endpoint =
      this.configService.get('MOMO_API_URL') ||
      'https://test-payment.momo.vn/v2/gateway/api/create';
    const redirectUrl =
      dto.returnUrl || this.configService.get('MOMO_REDIRECT_URL');
    const ipnUrl = this.configService.get('MOMO_IPN_URL');

    const requestId = dto.orderId + '_' + Date.now();
    const orderId = dto.orderId;
    const orderInfo = dto.orderDescription || `Thanh toan don hang ${orderId}`;
    const amount = dto.amount.toString();
    const requestType = 'captureWallet';
    const extraData = ''; // base64 encoded string if needed

    const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;

    const signature = crypto
      .createHmac('sha256', secretKey)
      .update(rawSignature)
      .digest('hex');

    const requestBody = {
      partnerCode,
      accessKey,
      requestId,
      amount,
      orderId,
      orderInfo,
      redirectUrl,
      ipnUrl,
      extraData,
      requestType,
      signature,
      lang: 'vi',
    };

    try {
      const response = await axios.post(endpoint, requestBody);
      if (response.data.resultCode === 0) {
        return {
          success: true,
          paymentUrl: response.data.payUrl,
          message: 'Redirect to MoMo',
          rawResponse: response.data,
        };
      } else {
        return {
          success: false,
          message: response.data.message,
          rawResponse: response.data,
        };
      }
    } catch (error) {
      this.logger.error(
        'MoMo payment request failed',
        error.response?.data || error.message,
      );
      return {
        success: false,
        message: 'MoMo payment request failed',
      };
    }
  }
}
