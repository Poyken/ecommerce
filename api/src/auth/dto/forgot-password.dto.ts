import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

/**
 * =====================================================================
 * FORGOT PASSWORD DTO - Đối tượng yêu cầu khôi phục mật khẩu
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. IDENTITY VERIFICATION:
 * - `email`: Là thông tin duy nhất cần thiết để hệ thống xác định người dùng đang yêu cầu khôi phục mật khẩu.
 *
 * 2. VALIDATION:
 * - `@IsEmail()`: Đảm bảo email nhập vào có cấu trúc đúng, tránh gửi yêu cầu vô ích lên server.
 * - Thông báo lỗi tiếng Việt giúp cải thiện trải nghiệm người dùng ngay từ bước nhập liệu.
 *
 * 3. PROCESS FLOW:
 * - Sau khi nhận được email hợp lệ, server sẽ tạo một Token và gửi vào email này để người dùng có thể thực hiện bước `reset-password`. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Tiếp nhận request từ Client, điều phối xử lý và trả về response.

 * =====================================================================
 */

export class ForgotPasswordDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Email của tài khoản cần khôi phục mật khẩu',
  })
  @IsEmail({}, { message: 'Email không hợp lệ' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  email: string;
}
