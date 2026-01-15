import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

/**
 * =====================================================================
 * UPDATE PROFILE DTO - Cập nhật thông tin cá nhân
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. TẠI SAO CÁC TRƯỜNG ĐỀU LÀ OPTIONAL?
 * - User có thể chỉ muốn đổi `avatarUrl` mà giữ nguyên `firstName`.
 * - Nếu bắt buộc gửi tất cả (`IsNotEmpty`), Frontend sẽ phải query dữ liệu cũ rồi gửi lại -> Thừa thãi.
 *
 * 2. VALIDATION:
 * - `MinLength(2)`: Tên người ít nhất phải 2 ký tự (vd: "An").
 * - `IsUrl()`: Đảm bảo avatar phải là link ảnh hợp lệ (thường từ Cloudinary/S3). *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Tiếp nhận request từ Client, điều phối xử lý và trả về response.

 * =====================================================================
 */
export class UpdateProfileDto {
  @ApiPropertyOptional({ example: 'John' })
  @IsString()
  @IsOptional()
  firstName?: string;

  @ApiPropertyOptional({ example: 'Doe' })
  @IsString()
  @IsOptional()
  lastName?: string;

  @ApiPropertyOptional({ example: 'new_avatar_url' })
  @IsString()
  @IsOptional()
  avatarUrl?: string;

  @ApiPropertyOptional({ example: 'newpassword123', minLength: 6 })
  @IsString()
  @IsOptional()
  @MinLength(6, { message: 'Mật khẩu phải ít nhất 6 ký tự' })
  password?: string;
}
