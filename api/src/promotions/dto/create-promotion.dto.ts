import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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
  @ApiProperty({ example: 'MIN_ORDER_VALUE' })
  @IsString()
  type: string;

  @ApiProperty({ example: 'GTE' })
  @IsString()
  operator: string;

  @ApiProperty({ example: '500000' })
  @IsString()
  value: string;
}

export class PromotionActionDto {
  @ApiProperty({ example: 'DISCOUNT_PERCENT' })
  @IsString()
  type: string;

  @ApiProperty({ example: '10' })
  @IsString()
  value: string;

  @ApiPropertyOptional({ example: 50000 })
  @IsOptional()
  @IsNumber()
  maxDiscountAmount?: number;
}

export class CreatePromotionDto {
  @ApiProperty({ example: 'Giảm giá mùa hè' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'SUMMER2024' })
  @IsString()
  code: string;

  @ApiPropertyOptional({ example: 'Chương trình khuyến mãi hè' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: '2024-06-01T00:00:00Z' })
  @IsDateString()
  startDate: string;

  @ApiProperty({ example: '2024-08-31T23:59:59Z' })
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  priority?: number;

  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  @IsInt()
  usageLimit?: number;

  @ApiProperty({ type: [PromotionRuleDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PromotionRuleDto)
  rules: PromotionRuleDto[];

  @ApiProperty({ type: [PromotionActionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PromotionActionDto)
  actions: PromotionActionDto[];
}
