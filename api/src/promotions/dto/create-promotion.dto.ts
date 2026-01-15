<<<<<<< HEAD
import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  IsNumber,
  Min,
} from 'class-validator';

export class CreatePromotionDto {
  @ApiProperty({ example: 'Summer Sale 2026' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Big discount for summer', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 10 })
  @IsNumber()
  @Min(0)
  discountPercent: number;
=======
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
>>>>>>> 8f5a875198d5ce2371ec25b2aeb50dc403c8c172
}
