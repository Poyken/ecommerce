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
  IsEnum,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

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

export class PromotionRuleDto {
  @ApiProperty({
    enum: PromotionRuleType,
    description: 'Loại điều kiện áp dụng',
    example: PromotionRuleType.MIN_ORDER_VALUE,
  })
  @IsEnum(PromotionRuleType)
  type: PromotionRuleType;

  @ApiProperty({
    enum: RuleOperator,
    description: 'Toán tử so sánh',
    example: RuleOperator.GTE,
  })
  @IsEnum(RuleOperator)
  operator: RuleOperator;

  @ApiProperty({
    description: 'Giá trị so sánh (string để hỗ trợ nhiều kiểu dữ liệu)',
    example: '500000',
  })
  @IsString()
  value: string;
}

export class PromotionActionDto {
  @ApiProperty({
    enum: PromotionActionType,
    description: 'Loại hành động giảm giá',
    example: PromotionActionType.DISCOUNT_PERCENT,
  })
  @IsEnum(PromotionActionType)
  type: PromotionActionType;

  @ApiProperty({
    description: 'Giá trị giảm (số tiền hoặc phần trăm)',
    example: '10',
  })
  @IsString()
  value: string;

  @ApiPropertyOptional({
    description: 'Số tiền giảm tối đa (cho loại phần trăm)',
    example: 100000,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxDiscountAmount?: number;
}

export class CreatePromotionDto {
  @ApiProperty({
    description: 'Tên chương trình khuyến mãi',
    example: 'Giảm 10% đơn hàng đầu tiên',
  })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    description: 'Mã khuyến mãi (để trống nếu tự động áp dụng)',
    example: 'WELCOME10',
  })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({
    description: 'Mô tả chi tiết chương trình',
    example: 'Áp dụng cho khách hàng mới, đơn tối thiểu 500k',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Ngày bắt đầu (ISO 8601)',
    example: '2025-01-01T00:00:00.000Z',
  })
  @IsDateString()
  startDate: string;

  @ApiProperty({
    description: 'Ngày kết thúc (ISO 8601)',
    example: '2025-12-31T23:59:59.000Z',
  })
  @IsDateString()
  endDate: string;

  @ApiPropertyOptional({
    description: 'Trạng thái kích hoạt',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Độ ưu tiên (số lớn = ưu tiên cao)',
    default: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  priority?: number;

  @ApiPropertyOptional({
    description: 'Giới hạn số lần sử dụng tổng cộng',
    example: 100,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  usageLimit?: number;

  @ApiProperty({
    type: [PromotionRuleDto],
    description: 'Danh sách điều kiện áp dụng',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PromotionRuleDto)
  rules: PromotionRuleDto[];

  @ApiProperty({
    type: [PromotionActionDto],
    description: 'Danh sách hành động khi thỏa điều kiện',
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PromotionActionDto)
  actions: PromotionActionDto[];
}
