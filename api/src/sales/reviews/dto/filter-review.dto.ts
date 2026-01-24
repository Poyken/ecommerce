import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { PaginationQuerySchema } from '@/common/dto/base.dto';

const FilterReviewSchema = PaginationQuerySchema.extend({
  rating: z.coerce
    .number()
    .int()
    .min(1)
    .max(5)
    .optional()
    .describe('Lọc theo số sao (1-5)'),
  status: z
    .enum(['published', 'hidden', 'all'])
    .optional()
    .describe('Trạng thái hiển thị'),
  search: z
    .string()
    .optional()
    .describe('Tìm kiếm theo nội dung, email hoặc tên'),
});

export class FilterReviewDto extends createZodDto(FilterReviewSchema) {}
