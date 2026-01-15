import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUrl, MinLength } from 'class-validator';

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
  @IsOptional()
  @IsString()
  @MinLength(2)
  firstName?: string;

  @ApiPropertyOptional({ example: 'Doe' })
  @IsOptional()
  @IsString()
  @MinLength(2)
  lastName?: string;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg' })
  @IsOptional()
  @IsUrl()
  avatarUrl?: string;

  @ApiPropertyOptional({ example: 'oldPassword123' })
  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;

  @ApiPropertyOptional({ example: 'newPassword123' })
  @IsOptional()
  @IsString()
  @MinLength(8)
  newPassword?: string;
}
