import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

/**
 * =====================================================================
 * CREATE PLAN DTO - Validate dữ liệu tạo gói cước
 * =====================================================================
 *
 * =====================================================================
 */

const CreatePlanSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).describe('Unique code'),
  description: z.string().optional(),
  priceMonthly: z.number().min(0),
  priceYearly: z.number().min(0),
  currency: z.string().optional(),
  maxProducts: z.number().min(0),
  maxStorage: z.number().min(0),
  transactionFee: z.number().min(0),
  features: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
  isPublic: z.boolean().optional(),
});

export class CreatePlanDto extends createZodDto(CreatePlanSchema) {}
