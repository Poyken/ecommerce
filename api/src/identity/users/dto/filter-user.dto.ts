import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { PaginationQuerySchema } from '@/common/dto/base.dto';

const FilterUserSchema = PaginationQuerySchema.extend({
  search: z.string().optional().describe('Tìm theo tên, email...'),
  role: z.string().optional().describe('Lọc theo vai trò (Role name)'),
});

export class FilterUserDto extends createZodDto(FilterUserSchema) {}
