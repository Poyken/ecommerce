import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

/**
 * =====================================================================
 * FEATURE FLAG DTO - Quản lý Cờ tính năng
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. RULES (JSONB):
 * - Trường `rules` lưu cấu hình phức tạp (dạng JSON).
 * - Ví dụ: `{ "percentage": 20 }` nghĩa là chỉ bật cho 20% user random.
 * - Ví dụ: `{ "environments": ["dev", "staging"] }` nghĩa là chỉ bật ở Dev/Staging.
 *
 * 2. ENABLED VS RULES:
 * - `isEnabled` là công tắc tổng. Nếu `false`, tính năng tắt hoàn toàn.
 * - Nếu `true`, hệ thống mới xét tiếp đến `rules` để quyết định bật cho ai. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Tiếp nhận request từ Client, điều phối xử lý và trả về response.

 * =====================================================================
 */
export class CreateFeatureFlagDto {
  @ApiProperty({ example: 'new_checkout_flow' })
  @IsString()
  @IsNotEmpty()
  key: string;

  @ApiProperty({ example: 'Enable the new checkout UI' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: false })
  @IsBoolean()
  @IsOptional()
  isEnabled?: boolean;

  @ApiProperty({ example: { percentage: 50 } })
  @IsOptional()
  rules?: any;
}

export class UpdateFeatureFlagDto {
  @ApiProperty({ example: 'Enable the new checkout UI' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: true })
  @IsBoolean()
  @IsOptional()
  isEnabled?: boolean;

  @ApiProperty({ example: { percentage: 100 } })
  @IsOptional()
  rules?: any;
}
