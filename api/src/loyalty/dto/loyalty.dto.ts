import {
  IsString,
  IsNotEmpty,
  IsInt,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// Local enum to bypass stale Prisma client types
export enum LoyaltyPointType {
  EARNED = 'EARNED',
  REDEEMED = 'REDEEMED',
  REFUNDED = 'REFUNDED',
}

export class EarnPointsDto {
  @ApiProperty({ description: 'ID người dùng', example: 'user-uuid' })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiPropertyOptional({
    description: 'ID đơn hàng liên quan',
    example: 'order-uuid',
  })
  @IsString()
  @IsOptional()
  orderId?: string;

  @ApiProperty({ description: 'Số điểm tích (giá trị dương)', example: 100 })
  @IsInt()
  amount: number;

  @ApiPropertyOptional({
    description: 'Lý do tích điểm',
    example: 'Hoàn thành đơn hàng',
  })
  @IsString()
  @IsOptional()
  reason?: string;
}

export class RedeemPointsDto {
  @ApiProperty({ description: 'ID người dùng', example: 'user-uuid' })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiPropertyOptional({
    description: 'ID đơn hàng sử dụng điểm',
    example: 'order-uuid',
  })
  @IsString()
  @IsOptional()
  orderId?: string;

  @ApiProperty({ description: 'Số điểm tiêu (giá trị dương)', example: 50 })
  @IsInt()
  amount: number;

  @ApiPropertyOptional({
    description: 'Lý do sử dụng điểm',
    example: 'Đổi điểm lấy giảm giá',
  })
  @IsString()
  @IsOptional()
  reason?: string;

  @ApiPropertyOptional({
    description: 'Tổng giá trị đơn hàng',
    example: 500000,
  })
  @IsInt()
  @IsOptional()
  orderTotal?: number;
}

export class RefundPointsDto {
  @ApiProperty({ description: 'ID người dùng', example: 'user-uuid' })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiPropertyOptional({
    description: 'ID đơn hàng hoàn tiền',
    example: 'order-uuid',
  })
  @IsString()
  @IsOptional()
  orderId?: string;

  @ApiProperty({ description: 'Số điểm hoàn lại', example: 50 })
  @IsInt()
  amount: number;

  @ApiPropertyOptional({
    description: 'Lý do hoàn điểm',
    example: 'Đơn hàng bị hủy',
  })
  @IsString()
  @IsOptional()
  reason?: string;
}
