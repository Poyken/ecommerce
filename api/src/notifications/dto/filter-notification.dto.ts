import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { PaginationQuerySchema } from '@/common/dto/base.dto';

const FilterNotificationSchema = PaginationQuerySchema.extend({
  userId: z.string().optional().describe('ID User'),
  type: z.string().optional().describe('Loại thông báo (VD: ORDER, SYSTEM)'),
  isRead: z
    .boolean()
    .optional()
    .or(z.string().transform((val) => val === 'true'))
    .describe('Trình trạng đã đọc'),
});

export class FilterNotificationDto extends createZodDto(
  FilterNotificationSchema,
) {}
