import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

/**
 * =====================================================================
 * RESET PASSWORD DTO - Đối tượng đặt lại mật khẩu
 * =====================================================================
 *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Xử lý logic nghiệp vụ, phối hợp các service liên quan để hoàn thành yêu cầu từ Controller.

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
