import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, MinLength } from 'class-validator';

/**
 * =====================================================================
 * RESET PASSWORD DTO - Đối tượng đặt lại mật khẩu
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. TOKEN VERIFICATION:
 * - `token`: Đây là mã bí mật được gửi qua email cho người dùng. Nó dùng để chứng minh người đang đổi mật khẩu chính là chủ sở hữu email.
 *
 * 2. CUSTOM ERROR MESSAGES:
 * - Ta sử dụng tham số `message` trong các decorator validation để trả về thông báo lỗi bằng tiếng Việt, giúp Frontend hiển thị trực tiếp cho người dùng mà không cần dịch lại.
 *
 * 3. SECURITY:
 * - Tiếp tục duy trì ràng buộc `@MinLength(6)` cho mật khẩu mới để đảm bảo an toàn.
 * =====================================================================
 */

export class ResetPasswordDto {
  @ApiProperty({ example: 'token_string', description: 'Token xác thực' })
  @IsNotEmpty({ message: 'Token không được để trống' })
  token: string;

  @ApiProperty({ example: 'newPassword123', description: 'Mật khẩu mới' })
  @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
  @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
  newPassword: string;
}
