import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const ReturnItemSchema = z.object({
  orderItemId: z
    .string()
    .min(1)
    .describe('ID của sản phẩm trong đơn hàng cần trả'),
  quantity: z.number().int().describe('Số lượng trả'),
});
export class ReturnItemDto extends createZodDto(ReturnItemSchema) {}

const CreateReturnRequestSchema = z.object({
  orderId: z.string().min(1).describe('ID đơn hàng'),
  reason: z
    .string()
    .min(1)
    .describe('Lý do trả hàng (Lỗi NSX, Không ưng ý...)'),
  description: z.string().optional().describe('Mô tả chi tiết thêm'),
  images: z
    .array(z.string())
    .optional()
    .describe('Danh sách URL ảnh bằng chứng hoặc ID Media'),
  items: z.array(ReturnItemSchema).describe('Danh sách các món cần trả'),
});

export class CreateReturnRequestDto extends createZodDto(
  CreateReturnRequestSchema,
) {}
