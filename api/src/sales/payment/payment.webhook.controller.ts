/**
 * =====================================================================
 * PAYMENT.WEBHOOK.CONTROLLER CONTROLLER
 * =====================================================================
 *
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
