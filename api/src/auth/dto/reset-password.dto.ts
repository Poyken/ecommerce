import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

/**
 * =====================================================================
 * RESET PASSWORD DTO - Đối tượng đặt lại mật khẩu
 * =====================================================================
 *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Tiếp nhận request từ Client, điều phối xử lý và trả về response.

 * =====================================================================
 */

const ResetPasswordSchema = z.object({
  token: z
    .string()
    .min(1, 'Token không được để trống')
    .describe('token_string'),
  newPassword: z
    .string()
    .min(1, 'Mật khẩu không được để trống')
    .min(6, 'Mật khẩu phải có ít nhất 6 ký tự')
    .describe('newPassword123'),
});

export class ResetPasswordDto extends createZodDto(ResetPasswordSchema) {}
