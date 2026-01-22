import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const CreateReviewSchema = z.object({
  productId: z
    .string()
    .min(1, 'ProductId không được để trống')
    .describe('ID sản phẩm được đánh giá'),
  rating: z
    .number()
    .int()
    .min(1, 'Rating tối thiểu là 1')
    .max(5, 'Rating tối đa là 5')
    .describe('Số sao đánh giá (1-5)'),
  content: z.string().optional().describe('Nội dung đánh giá'),
  skuId: z
    .string()
    .optional()
    .describe('ID SKU cụ thể (nếu đánh giá biến thể)'),
  images: z.array(z.string()).optional().describe('Danh sách URL ảnh đính kèm'),
});

export class CreateReviewDto extends createZodDto(CreateReviewSchema) {}
