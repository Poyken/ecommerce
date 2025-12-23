import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

/**
 * =====================================================================
 * CREATE ADDRESS DTO - Đối tượng tạo địa chỉ mới
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. COMPREHENSIVE VALIDATION:
 * - Sử dụng `class-validator` để đảm bảo mọi thông tin địa chỉ đều hợp lệ trước khi lưu vào DB.
 * - `@IsNotEmpty()`: Bắt buộc phải có các thông tin cốt lõi như tên người nhận, số điện thoại, thành phố.
 *
 * 2. OPTIONAL FIELDS:
 * - `@IsOptional()`: Một số trường như `ward` (phường/xã) hoặc `postalCode` có thể không bắt buộc tùy theo khu vực.
 *
 * 3. DEFAULT ADDRESS LOGIC:
 * - `isDefault`: Cho phép người dùng đánh dấu địa chỉ này là địa chỉ mặc định để tự động chọn khi thanh toán.
 * =====================================================================
 */

export class CreateAddressDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  recipientName: string;

  @ApiProperty({ example: '0987654321' })
  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @ApiProperty({ example: '123 Main St' })
  @IsString()
  @IsNotEmpty()
  street: string;

  @ApiProperty({ example: 'Hanoi' })
  @IsString()
  @IsNotEmpty()
  city: string;

  @ApiProperty({ example: 'Ba Dinh' })
  @IsString()
  @IsNotEmpty()
  district: string;

  @ApiProperty({ example: 'Lieu Giai', required: false })
  @IsString()
  @IsOptional()
  ward?: string;

  @ApiProperty({ example: '100000', required: false })
  @IsString()
  @IsOptional()
  postalCode?: string;

  @ApiProperty({ example: 'Vietnam', required: false })
  @IsString()
  @IsOptional()
  country?: string;

  @ApiProperty({ example: false, required: false })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}
