import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

/**
 * =====================================================================
 * FEATURE FLAG DTO - Quản lý Cờ tính năng
 * =====================================================================
 *
 * =====================================================================
 */
const CreateFeatureFlagSchema = z.object({
  key: z.string().min(1).describe('new_checkout_flow'),
  description: z.string().optional().describe('Enable the new checkout UI'),
  isEnabled: z.boolean().optional().default(false),
  rules: z.any().optional().describe('{ "percentage": 50 }'),
});
export class CreateFeatureFlagDto extends createZodDto(
  CreateFeatureFlagSchema,
) {}

export class UpdateFeatureFlagDto extends createZodDto(
  CreateFeatureFlagSchema.partial(),
) {}
