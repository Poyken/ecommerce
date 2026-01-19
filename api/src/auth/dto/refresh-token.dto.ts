import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

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
 * - Việc kiểm tra tính hợp lệ và cấp mới sẽ do `AuthService` và `TokenService` đảm nhận. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Tiếp nhận request từ Client, điều phối xử lý và trả về response.

 * =====================================================================
 */

const RefreshTokenSchema = z.object({
  refreshToken: z
    .string()
    .min(1, 'Refresh token cannot be empty')
    .describe('refresh-token-string'),
});

export class RefreshTokenDto extends createZodDto(RefreshTokenSchema) {}
