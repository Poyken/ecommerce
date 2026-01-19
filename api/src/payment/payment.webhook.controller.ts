/**
 * =====================================================================
 * PAYMENT.WEBHOOK.CONTROLLER CONTROLLER
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * Controller này xử lý các HTTP request từ client.
 *
 * 1. NHIỆM VỤ CHÍNH:
 *    - Nhận request từ client
 *    - Validate dữ liệu đầu vào
 *    - Gọi service xử lý logic
 *    - Trả về response cho client
 *
 * 2. CÁC ENDPOINT:
 *    - [Liệt kê các endpoint] *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Tiếp nhận request từ Client, validate dữ liệu và điều phối xử lý logic thông qua các Service tương ứng.

 * =====================================================================
 */

import { Body, Controller, Post, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PaymentService } from './payment.service';
import { WebhookPayloadDto } from './dto/webhook-payload.dto';

@ApiTags('Payment Webhook')
@Controller('payment/webhook')
export class PaymentWebhookController {
  private readonly logger = new Logger(PaymentWebhookController.name);

  constructor(private readonly paymentService: PaymentService) {}

  @Post('vietqr')
  @ApiOperation({
    summary: 'Receive payment notification from VietQR gateway (Casso/SePay)',
  })
  async handleVietQrWebhook(@Body() payload: WebhookPayloadDto) {
    this.logger.log(`Received VietQR webhook: ${JSON.stringify(payload)}`);
    return this.paymentService.handleWebhook(payload);
  }

  @Post('test')
  @ApiOperation({ summary: 'Manual trigger for testing payment success' })
  async manualTrigger(@Body() payload: WebhookPayloadDto) {
    this.logger.log(`Manual payment trigger: ${JSON.stringify(payload)}`);
    return this.paymentService.handleWebhook(payload);
  }
}
