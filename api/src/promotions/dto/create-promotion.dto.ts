import {
  IsString,
  IsOptional,
  IsBoolean,
  IsInt,
  IsDateString,
  ValidateNested,
  IsNumber,
  IsArray,
} from 'class-validator';
import { Type } from 'class-transformer';

export class PromotionRuleDto {
  @IsString()
  type: string; // MIN_ORDER_VALUE, SPECIFIC_CATEGORY, CUSTOMER_GROUP

  @IsString()
  operator: string; // GTE, EQ, IN

  @IsString()
  value: string;
}

export class PromotionActionDto {
  @IsString()
  type: string; // DISCOUNT_FIXED, DISCOUNT_PERCENT, FREE_SHIPPING, GIFT

  @IsString()
  value: string;

  @IsOptional()
  @IsNumber()
  maxDiscountAmount?: number;
}

export class CreatePromotionDto {
  @IsString()
  name: string;

  @IsString()
  code: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsInt()
  priority?: number;

  @IsOptional()
  @IsInt()
  usageLimit?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PromotionRuleDto)
  rules: PromotionRuleDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PromotionActionDto)
  actions: PromotionActionDto[];
}
