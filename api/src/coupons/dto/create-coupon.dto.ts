import { DiscountType } from '@prisma/client';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateCouponDto {
  /**
   * =====================================================================
   * CREATE COUPON DTO
   * =====================================================================
   *
   * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
   *
   * VALIDATION RULES:
   * - `minOrderAmount`: Giá trị đơn hàng tối thiểu để áp dụng (VD: 100k).
   * - `maxDiscountAmount`: Giảm tối đa (VD: Giảm 10% nhưng không quá 50k).
   * - `usageLimit`: Giới hạn số lần dùng chung cho toàn hệ thống.
   * =====================================================================
   */
  @IsString()
  @IsNotEmpty()
  code: string;

  @IsEnum(DiscountType)
  @IsNotEmpty()
  discountType: DiscountType;

  @IsNumber()
  @Min(0)
  discountValue: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  minOrderAmount?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  maxDiscountAmount?: number;

  @IsDateString()
  @IsNotEmpty()
  startDate: string;

  @IsDateString()
  @IsNotEmpty()
  endDate: string;

  @IsNumber()
  @IsOptional()
  @Min(1)
  usageLimit?: number;
}
