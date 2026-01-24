/**
 * =====================================================================
 * WEBHOOK-PAYLOAD DTO (DATA TRANSFER OBJECT)
 * =====================================================================
 *
 * =====================================================================
 */

import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const WebhookPayloadSchema = z.object({
  gatewayTransactionId: z.string().optional().describe('VQ-12345678'),
  content: z.string().describe('Transaction description'),
  amount: z.number().describe('500000'),
  transactionDate: z.string().optional().describe('ISO Date String'),
  accountNumber: z.string().optional().describe('123456'),
});

export class WebhookPayloadDto extends createZodDto(WebhookPayloadSchema) {}
