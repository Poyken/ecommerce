import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

/**
 * =====================================================================
 * CREATE BRAND DTO - Đối tượng tạo thương hiệu mới
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. SIMPLE VALIDATION:
 * - Chỉ yêu cầu trường `name` là chuỗi và không được để trống.
 * - Các thông tin khác (như Logo) có thể được bổ sung sau hoặc xử lý qua một API tải ảnh riêng.
 * =====================================================================
 */

export class CreateBrandDto {
  @ApiProperty({ example: 'Apple' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'https://cloudinary.com/image.jpg', required: false })
  @IsString()
  @IsOptional()
  imageUrl?: string;
}
