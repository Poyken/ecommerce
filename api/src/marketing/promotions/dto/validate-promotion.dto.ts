import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const CartItemSchema = z.object({
  skuId: z.string(),
  quantity: z.number(),
  price: z.number(),
  categoryId: z.string().optional(),
  productId: z.string().optional(),
});
export class CartItemDto extends createZodDto(CartItemSchema) {}

export const ValidatePromotionSchema = z.object({
  code: z.string(),
  totalAmount: z.number(),
  userId: z.string().optional(),
  customerGroupId: z.string().optional(),
  items: z.array(CartItemSchema).optional(),
});
export class ValidatePromotionDto extends createZodDto(
  ValidatePromotionSchema,
) {}

export const ApplyPromotionSchema = ValidatePromotionSchema.extend({
  orderId: z.string(),
});
export class ApplyPromotionDto extends createZodDto(ApplyPromotionSchema) {}
