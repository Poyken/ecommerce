import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, MinLength } from 'class-validator';

/**
 * =====================================================================
 * REGISTER DTO - Đối tượng dữ liệu đăng ký tài khoản
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. USER PROFILE DATA:
 * - Ngoài Email và Mật khẩu, ta yêu cầu thêm `firstName` và `lastName` để cá nhân hóa trải nghiệm người dùng ngay từ đầu.
 *
 * 2. STRING VALIDATION:
 * - `@MinLength(2)` cho tên: Tránh việc người dùng nhập tên quá ngắn hoặc ký tự rác.
 * - `@MinLength(6)` cho mật khẩu: Đảm bảo độ phức tạp tối thiểu.
 *
 * 3. DATA CONSISTENCY:
 * - DTO này đảm bảo rằng mọi tài khoản mới được tạo ra đều có đầy đủ các thông tin cơ bản cần thiết cho hệ thống.
 * =====================================================================
 */

export class RegisterDto {
  @ApiProperty({
    example: 'test@example.com',
    description: 'The email of the user',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'password123',
    description: 'The password of the user',
    minLength: 6,
  })
  @MinLength(6)
  password: string;

  @ApiProperty({
    example: 'John',
    description: 'The first name of the user',
    minLength: 2,
  })
  @MinLength(2)
  firstName: string;

  @ApiProperty({
    example: 'Doe',
    description: 'The last name of the user',
    minLength: 2,
  })
  @MinLength(2)
  lastName: string;
}
