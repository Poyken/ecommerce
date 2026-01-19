import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { PaginationQuerySchema } from '@/common/dto/base.dto';

export enum SortOption {
  PRICE_ASC = 'price_asc',
  PRICE_DESC = 'price_desc',
  NEWEST = 'newest',
  OLDEST = 'oldest',
  RATING_DESC = 'rating_desc',
}

const FilterProductSchema = PaginationQuerySchema.extend({
  search: z.string().optional().describe('Tìm theo tên hoặc mô tả'),
  categoryId: z.string().optional().describe('Lọc theo ID danh mục'),
  brandId: z.string().optional().describe('Lọc theo ID thương hiệu'),
  ids: z
    .string()
    .optional()
    .describe('Lọc theo danh sách ID sản phẩm (phân tách bằng dấu phẩy)'),
  minPrice: z.coerce.number().min(0).optional().describe('Giá thấp nhất'),
  maxPrice: z.coerce.number().min(0).optional().describe('Giá cao nhất'),
  sort: z.nativeEnum(SortOption).optional().describe('Sắp xếp theo'),
  includeSkus: z
    .boolean()
    .optional() // nestjs-zod handles string->boolean coercion if configured, else use transform
    .or(z.string().transform((val) => val === 'true'))
    .optional()
    .describe('Có bao gồm đầy đủ thông tin SKU không (true/false)'),
});

export class FilterProductDto extends createZodDto(FilterProductSchema) {}
