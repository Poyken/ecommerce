import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const OrderFilterSchema = z.object({
  search: z.string().optional(),
  status: z.string().optional(),
  userId: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).default(10),
  includeItems: z.string().optional().describe("'true' or 'false'"),
});

export class OrderFilterDto extends createZodDto(OrderFilterSchema) {}
