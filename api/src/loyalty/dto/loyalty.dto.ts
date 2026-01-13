import {
  IsString,
  IsNotEmpty,
  IsInt,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { LoyaltyPointType } from '@prisma/client';

export class EarnPointsDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsOptional()
  orderId?: string;

  @IsInt()
  amount: number; // Số điểm tích (dương)

  @IsString()
  @IsOptional()
  reason?: string;
}

export class RedeemPointsDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsOptional()
  orderId?: string;

  @IsInt()
  amount: number; // Số điểm tiêu (dương, sẽ được chuyển thành âm)

  @IsString()
  @IsOptional()
  reason?: string;
}

export class RefundPointsDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsOptional()
  orderId?: string;

  @IsInt()
  amount: number;

  @IsString()
  @IsOptional()
  reason?: string;
}
