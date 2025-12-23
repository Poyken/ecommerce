import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

/**
 * =====================================================================
 * REFRESH TOKEN DTO - Đối tượng làm mới phiên đăng nhập
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. SILENT RE-AUTHENTICATION:
 * - `refreshToken`: Dùng để gửi lên server khi Access Token hết hạn.
 * - Giúp người dùng không bị văng ra khỏi ứng dụng khi đang sử dụng (trải nghiệm mượt mà).
 *
 * 2. MINIMAL DATA:
 * - DTO này chỉ cần duy nhất một trường `refreshToken`.
 * - Việc kiểm tra tính hợp lệ và cấp mới sẽ do `AuthService` và `TokenService` đảm nhận.
 * =====================================================================
 */

export class RefreshTokenDto {
  @ApiProperty({
    example: 'refresh-token-string',
    description: 'The refresh token',
  })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}
