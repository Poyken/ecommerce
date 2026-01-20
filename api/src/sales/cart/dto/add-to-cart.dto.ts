import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

/**
 * =====================================================================
 * ADD TO CART DTO
 * =====================================================================
 */
const AddToCartSchema = z.object({
  skuId: z
    .string()
    .uuid('SKU ID không hợp lệ')
    .describe('Mã định danh của SKU sản phẩm'),
  quantity: z
    .number()
    .min(1, 'Số lượng tối thiểu là 1')
    .max(999, 'Số lượng tối đa là 999 sản phẩm')
    .describe('Số lượng muốn thêm'),
});

export class AddToCartDto extends createZodDto(AddToCartSchema) {}
