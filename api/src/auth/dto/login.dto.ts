import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

/**
 * =====================================================================
 * LOGIN DTO - Đối tượng dữ liệu đăng nhập
 * =====================================================================
 *
 * 1. ZOD SCHEMA:
 * - Define validation rules using Zod.
 * - `z.string().email()`: Email validation.
 * - `z.string().min(6)`: Password min length.
 *
 * 2. NESTJS-ZOD:
 * - `createZodDto`: Automatically generates the class and Swagger docs.
 * =====================================================================
 */

const LoginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email không được để trống')
    .email('Email không hợp lệ')
    .describe('admin@example.com'),
  password: z
    .string()
    .min(1, 'Mật khẩu không được để trống')
    .describe('password123'),
});

export class LoginDto extends createZodDto(LoginSchema) {}
