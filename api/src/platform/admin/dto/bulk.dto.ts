import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const ImportRowSchema = z.object({
  skuCode: z.string(),
  price: z.number().optional(),
  salePrice: z.number().optional(),
  stock: z.number().optional(),
  status: z.string().optional(),
});
export class ImportRowDto extends createZodDto(ImportRowSchema) {}

export const ImportSkusSchema = z.object({
  rows: z.array(ImportRowSchema),
  dryRun: z.boolean().optional().default(false),
});
export class ImportSkusDto extends createZodDto(ImportSkusSchema) {}

export const PriceChangeSchema = z.object({
  type: z.enum(['fixed', 'percentage']),
  value: z.number(),
});
export class PriceChangeDto extends createZodDto(PriceChangeSchema) {}

export const StockChangeSchema = z.object({
  type: z.enum(['set', 'add', 'subtract']),
  value: z.number(),
});
export class StockChangeDto extends createZodDto(StockChangeSchema) {}

export const BulkUpdateSchema = z.object({
  skuIds: z.array(z.string()),
  priceChange: PriceChangeSchema.optional(),
  stockChange: StockChangeSchema.optional(),
});
export class BulkUpdateDto extends createZodDto(BulkUpdateSchema) {}
