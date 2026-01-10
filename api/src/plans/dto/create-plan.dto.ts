/**
 * =====================================================================
 * CREATE PLAN DTO - Validate dữ liệu tạo gói cước
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. BUSINESS RULES:
 * - `priceMonthly`, `priceYearly`: Phải >= 0 (Không cho phép giá âm).
 * - `slug`: Mã định danh duy nhất (VD: "pro-plan", "starter") dùng để config trong code
 *   thay vì dùng ID (UUID khó nhớ).
 *
 * 2. CLASS VALIDATOR:
 * - Thư viện này tự động kiểm tra dữ liệu đầu vào trước khi đến Controller.
 * =====================================================================
 */
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreatePlanDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  slug: string; // Unique code

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(0)
  priceMonthly: number;

  @IsNumber()
  @Min(0)
  priceYearly: number;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsNumber()
  @Min(0)
  maxProducts: number;

  @IsNumber()
  @Min(0)
  maxStorage: number;

  @IsNumber()
  @Min(0)
  transactionFee: number;

  @IsOptional()
  features?: string[]; // Array of feature codes

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;
}
