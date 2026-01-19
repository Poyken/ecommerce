/**
 * =====================================================================
 * WEBHOOK-PAYLOAD DTO (DATA TRANSFER OBJECT)
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * DTO định nghĩa cấu trúc dữ liệu truyền giữa các layer.
 *
 * 1. MỤC ĐÍCH:
 *    - Validate dữ liệu đầu vào
 *    - Định nghĩa kiểu dữ liệu cho request/response
 *    - Tách biệt dữ liệu API với database entity
 *
 * 2. DECORATORS SỬ DỤNG:
 *    - @IsString(), @IsNumber()...: Validate kiểu dữ liệu
 *    - @IsOptional(): Field không bắt buộc
 *    - @ApiProperty(): Tài liệu Swagger *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Tiếp nhận request từ Client, điều phối xử lý và trả về response.

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
