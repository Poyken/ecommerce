import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

/**
 * =====================================================================
 * REFRESH TOKEN DTO - Đối tượng làm mới phiên đăng nhập
 * =====================================================================
 *
 * =====================================================================
 */

const RefreshTokenSchema = z.object({
  refreshToken: z
    .string()
    .min(1, 'Refresh token cannot be empty')
    .describe('refresh-token-string'),
});

export class RefreshTokenDto extends createZodDto(RefreshTokenSchema) {}
