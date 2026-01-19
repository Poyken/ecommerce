import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const CreateSkuSchema = z.object({
  skuCode: z.string().min(1).describe('IP15PM-BLUE-256'),
  price: z.number().min(0).describe('29990000'),
  stock: z.number().min(0).describe('100'),
  productId: z.string().uuid().describe('uuid-product-id'),
  optionValueIds: z
    .array(z.string().uuid())
    .describe('["uuid-opt-val-1", "uuid-opt-val-2"]'),
  status: z.string().optional().describe('ACTIVE'),
  imageUrl: z.string().optional().describe('Image URL or binary'),
});

export class CreateSkuDto extends createZodDto(CreateSkuSchema) {}
