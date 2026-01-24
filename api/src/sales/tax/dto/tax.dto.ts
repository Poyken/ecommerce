import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const CreateTaxRateSchema = z.object({
  name: z.string().min(1).describe('Ví dụ: VAT 10%, VAT 5%'),
  rate: z.number().min(0).max(100).describe('Tỷ lệ phần trăm (0-100)'),
  isActive: z.boolean().optional(),
});
export class CreateTaxRateDto extends createZodDto(CreateTaxRateSchema) {}

const UpdateTaxRateSchema = CreateTaxRateSchema.partial();
export class UpdateTaxRateDto extends createZodDto(UpdateTaxRateSchema) {}

const ApplyTaxSchema = z.object({
  orderId: z.string().min(1),
  taxRateId: z.string().min(1),
});
export class ApplyTaxDto extends createZodDto(ApplyTaxSchema) {}
