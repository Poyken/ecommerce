import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { ReturnStatus } from '@prisma/client';

const UpdateReturnStatusSchema = z.object({
  status: z
    .nativeEnum(ReturnStatus)
    .describe('Trạng thái mới: APPROVED, REJECTED, REFUNDED...'),
  adminNote: z
    .string()
    .optional()
    .describe('Ghi chú của admin (lý do từ chối hoặc hướng dẫn)'),
  refundAmount: z
    .number()
    .optional()
    .describe('Số tiền hoàn lại (nếu khác với tính toán tự động)'),
});

export class UpdateReturnStatusDto extends createZodDto(
  UpdateReturnStatusSchema,
) {}
