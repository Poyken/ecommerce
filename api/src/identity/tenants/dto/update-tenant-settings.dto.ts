import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const UpdateTenantSettingsSchema = z.object({
  loyaltyPointRatio: z
    .number()
    .min(1)
    .optional()
    .describe('Tỷ lệ tích điểm (VD: 1000đ = 1 điểm)'),
  isLoyaltyEnabled: z
    .boolean()
    .optional()
    .describe('Bật/tắt hệ thống tích điểm'),
  defaultShippingFee: z
    .number()
    .min(0)
    .optional()
    .describe('Phí vận chuyển mặc định'),
  freeShippingThreshold: z
    .number()
    .min(0)
    .optional()
    .describe('Ngưỡng miễn phí vận chuyển'),
});

export class UpdateTenantSettingsDto extends createZodDto(
  UpdateTenantSettingsSchema,
) {}
