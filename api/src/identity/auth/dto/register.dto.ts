import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

/**
 * =====================================================================
 * REGISTER DTO - Đối tượng dữ liệu đăng ký tài khoản
 * =====================================================================
 *
 * =====================================================================
 */

const RegisterSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Invalid email address')
    .describe('The email of the user'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(6, 'Password must be at least 6 characters')
    .describe('The password of the user'),
  firstName: z
    .string()
    .min(1, 'First name is required')
    .min(2, 'First name must be at least 2 characters')
    .describe('The first name of the user'),
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .min(2, 'Last name must be at least 2 characters')
    .describe('The last name of the user'),
});

export class RegisterDto extends createZodDto(RegisterSchema) {}
