import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

/**
 * =====================================================================
 * SUBSCRIBE DTO - Đối tượng đăng ký nhận tin
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. EMAIL VALIDATION:
 * - `@IsEmail()`: Đảm bảo chuỗi nhập vào phải đúng định dạng email (có @, có tên miền).
 * - Đây là bước kiểm tra quan trọng nhất để tránh rác (Spam) trong danh sách newsletter.
 *
 * 2. CUSTOM ERROR MESSAGES:
 * - Sử dụng thuộc tính `message` để trả về thông báo lỗi thân thiện bằng tiếng Việt cho người dùng Frontend. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Tiếp nhận request từ Client, điều phối xử lý và trả về response.

 * =====================================================================
 */

export class SubscribeDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Email đăng ký nhận tin',
  })
  @IsEmail({}, { message: 'Email không hợp lệ' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  email: string;
}
