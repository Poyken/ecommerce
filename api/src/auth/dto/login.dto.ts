import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, MinLength } from 'class-validator';

/**
 * =====================================================================
 * LOGIN DTO - Đối tượng dữ liệu đăng nhập
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. INPUT VALIDATION:
 * - `@IsEmail()`: Đảm bảo người dùng nhập đúng định dạng email (VD: abc@gmail.com).
 * - `@MinLength(6)`: Ràng buộc mật khẩu tối thiểu 6 ký tự để đảm bảo độ bảo mật cơ bản.
 *
 * 2. SWAGGER DOCUMENTATION:
 * - `@ApiProperty`: Giúp tự động tạo tài liệu API. Người dùng có thể nhìn thấy ví dụ (`example`) và mô tả (`description`) ngay trên giao diện Swagger.
 *
 * 3. DATA TRANSFER OBJECT (DTO):
 * - Đóng vai trò là "hợp đồng" giữa Frontend và Backend. Frontend phải gửi đúng các trường này thì Backend mới xử lý.
 * =====================================================================
 */

export class LoginDto {
  @ApiProperty({
    example: 'admin@example.com',
    description: 'The email of the user',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: '123456',
    description: 'The password of the user',
    minLength: 6,
  })
  @MinLength(6)
  password: string;
}
