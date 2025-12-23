import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

/**
 * =====================================================================
 * CREATE USER DTO - Đối tượng tạo người dùng mới (Dành cho Admin)
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. ADMIN-LEVEL CREATION:
 * - Khác với `RegisterDto` (người dùng tự đăng ký), DTO này dùng cho Admin để tạo tài khoản nhân viên hoặc khách hàng thủ công.
 *
 * 2. DATA INTEGRITY:
 * - Đảm bảo mọi người dùng mới đều có đầy đủ thông tin cơ bản: Email, Mật khẩu, Họ và Tên.
 * - `@IsNotEmpty()`: Ngăn chặn việc tạo các tài khoản "rác" thiếu thông tin.
 *
 * 3. SECURITY:
 * - Vẫn áp dụng `@MinLength(6)` cho mật khẩu để duy trì tiêu chuẩn bảo mật chung của hệ thống.
 * =====================================================================
 */

export class CreateUserDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'password123', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'John' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  // Tùy chọn: Cho phép gán vai trò trong khi tạo (Tính năng Admin)
  // @ApiProperty({ example: ['admin', 'manager'], required: false })
  // @IsOptional()
  // roles?: string[];
}
