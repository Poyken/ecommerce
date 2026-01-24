import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

/**
 * =====================================================================
 * UPDATE PROFILE DTO - Cập nhật thông tin cá nhân
 * =====================================================================
 *
 * =====================================================================
 */
const UpdateProfileSchema = z.object({
  firstName: z.string().optional().describe('John'),
  lastName: z.string().optional().describe('Doe'),
  avatarUrl: z.string().optional().describe('new_avatar_url'),
  password: z
    .string()
    .min(6, 'Mật khẩu phải ít nhất 6 ký tự')
    .optional()
    .describe('newpassword123'),
});

export class UpdateProfileDto extends createZodDto(UpdateProfileSchema) {}
