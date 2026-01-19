import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { OrderStatus, PaymentStatus } from '@prisma/client';

export { OrderStatus, PaymentStatus };

const UpdateOrderStatusSchema = z.object({
  status: z.nativeEnum(OrderStatus).describe('Order status'),
  notify: z.boolean().optional(),
  force: z.boolean().optional().describe('Force status update (Admin only)'),
  cancellationReason: z.string().optional(),
  paymentStatus: z.nativeEnum(PaymentStatus).optional(),
});

export class UpdateOrderStatusDto extends createZodDto(
  UpdateOrderStatusSchema,
) {}
