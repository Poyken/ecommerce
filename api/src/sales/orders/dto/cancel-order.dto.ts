import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const CancelOrderSchema = z.object({
  cancellationReason: z.string().min(5, { message: 'Reason must be at least 5 characters long' }),
});

export class CancelOrderDto extends createZodDto(CancelOrderSchema) {}
