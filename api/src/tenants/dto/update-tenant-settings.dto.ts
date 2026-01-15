import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsOptional, Min } from 'class-validator';

export class UpdateTenantSettingsDto {
  @ApiPropertyOptional({
    description: 'Tỷ lệ tích điểm (VD: 1000đ = 1 điểm)',
    example: 1000,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  loyaltyPointRatio?: number;

  @ApiPropertyOptional({ description: 'Bật/tắt hệ thống tích điểm' })
  @IsOptional()
  @IsBoolean()
  isLoyaltyEnabled?: boolean;

  @ApiPropertyOptional({
    description: 'Phí vận chuyển mặc định',
    example: 30000,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  defaultShippingFee?: number;

  @ApiPropertyOptional({
    description: 'Ngưỡng miễn phí vận chuyển',
    example: 500000,
  })
  @IsOptional()
  @IsNumber()
  @IsOptional()
  @Min(0)
  freeShippingThreshold?: number;
}
