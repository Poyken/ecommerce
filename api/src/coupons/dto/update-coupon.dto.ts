import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateCouponDto } from './create-coupon.dto';

export class UpdateCouponDto extends PartialType(CreateCouponDto) {
  /**
   * =====================================================================
   * UPDATE COUPON DTO
   * =====================================================================
   *
   * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
   * - `PartialType`: Biến tất cả các field của `CreateCouponDto` thành Optional.
   * - `isActive`: Field riêng chỉ Update mới có (Create mặc định là true hoặc logic khác).
   * =====================================================================
   */
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
