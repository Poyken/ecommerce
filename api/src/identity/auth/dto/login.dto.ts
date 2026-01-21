import { createZodDto } from 'nestjs-zod';
import { z } from 'zod'; // Keep only one import

// Removed duplicate imports

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
