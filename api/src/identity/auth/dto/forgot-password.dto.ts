import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

/**
 * =====================================================================
 * FORGOT PASSWORD DTO - Đối tượng yêu cầu khôi phục mật khẩu
 * =====================================================================
 *
 * =====================================================================
 */

const ForgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'Email không được để trống')
    .email('Email không hợp lệ')
    .describe('admin@example.com'),
});

export class ForgotPasswordDto extends createZodDto(ForgotPasswordSchema) {}
