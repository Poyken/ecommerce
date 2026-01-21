import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

/**
 * Định nghĩa các loại Rule cho promotion
 */
export enum PromotionRuleType {
  MIN_ORDER_VALUE = 'MIN_ORDER_VALUE',
  SPECIFIC_CATEGORY = 'SPECIFIC_CATEGORY',
  SPECIFIC_PRODUCT = 'SPECIFIC_PRODUCT',
  CUSTOMER_GROUP = 'CUSTOMER_GROUP',
  FIRST_ORDER = 'FIRST_ORDER',
  MIN_QUANTITY = 'MIN_QUANTITY',
}

/**
 * Định nghĩa các operator so sánh
 */
export enum RuleOperator {
  EQ = 'EQ',
  GTE = 'GTE',
  LTE = 'LTE',
  GT = 'GT',
  LT = 'LT',
  IN = 'IN',
  NOT_IN = 'NOT_IN',
}

/**
 * Định nghĩa các loại Action
 */
export enum PromotionActionType {
  DISCOUNT_FIXED = 'DISCOUNT_FIXED',
  DISCOUNT_PERCENT = 'DISCOUNT_PERCENT',
  FREE_SHIPPING = 'FREE_SHIPPING',
  GIFT = 'GIFT',
  BUY_X_GET_Y = 'BUY_X_GET_Y',
}

export const PromotionRuleSchema = z.object({
  type: z.nativeEnum(PromotionRuleType),
  operator: z.nativeEnum(RuleOperator),
  value: z.string(),
});
export class PromotionRuleDto extends createZodDto(PromotionRuleSchema) {}

export const PromotionActionSchema = z.object({
  type: z.nativeEnum(PromotionActionType),
  value: z.string(),
  maxDiscountAmount: z.number().min(0).optional(),
});
export class PromotionActionDto extends createZodDto(PromotionActionSchema) {}

export const CreatePromotionSchema = z.object({
  name: z.string().min(1).describe('Tên chương trình khuyến mãi'),
  code: z
    .string()
    .optional()
    .describe('Mã khuyến mãi (để trống nếu tự động áp dụng)'),
  description: z.string().optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  isActive: z.boolean().optional().default(true),
  priority: z.number().int().min(0).optional().default(0),
  usageLimit: z.number().int().min(1).optional(),
  rules: z.array(PromotionRuleSchema),
  actions: z.array(PromotionActionSchema),
});

export class CreatePromotionDto extends createZodDto(CreatePromotionSchema) {}
