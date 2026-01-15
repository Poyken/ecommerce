import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

/**
 * =====================================================================
 * CREATE USER DTO - Đối tượng tạo người dùng mới
 * =====================================================================
 */

export class CreateUserDto {
  @ApiProperty({ example: 'admin@example.com' })
  @IsEmail({}, { message: 'Email không hợp lệ' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  email: string;

  @ApiProperty({ example: 'password123', minLength: 6 })
  @IsString()
  @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
  @MinLength(6, { message: 'Mật khẩu phải ít nhất 6 ký tự' })
  password: string;

  @ApiProperty({ example: 'Admin' })
  @IsString()
  @IsNotEmpty({ message: 'Tên không được để trống' })
  firstName: string;

  @ApiProperty({ example: 'System' })
  @IsString()
  @IsNotEmpty({ message: 'Họ không được để trống' })
  lastName: string;

  @ApiPropertyOptional({ example: 'https://avatar-url.com' })
  @IsString()
  @IsOptional()
  avatarUrl?: string;
}
