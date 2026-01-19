import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const UpdateSkuSchema = z.object({
  id: z.string().min(1).describe('uuid-sku-id'),
  price: z.number().optional().describe('100000'),
  salePrice: z.number().optional().describe('90000'),
  stock: z.number().optional().describe('50'),
});

export class UpdateSkuDto extends createZodDto(UpdateSkuSchema) {}

const BulkUpdateSkusSchema = z.object({
  skus: z.array(UpdateSkuSchema),
});

export class BulkUpdateSkusDto extends createZodDto(BulkUpdateSkusSchema) {}
