import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

/**
 * =====================================================================
 * CREATE USER DTO - Đối tượng tạo người dùng mới
 * =====================================================================
 */

export const CreateUserSchema = z.object({
  email: z
    .string()
    .min(1, 'Email không được để trống')
    .email('Email không hợp lệ')
    .describe('admin@example.com'),
  password: z
    .string()
    .min(1, 'Mật khẩu không được để trống')
    .min(6, 'Mật khẩu phải ít nhất 6 ký tự')
    .describe('password123'),
  firstName: z.string().min(1, 'Tên không được để trống').describe('Admin'),
  lastName: z.string().min(1, 'Họ không được để trống').describe('System'),
  avatarUrl: z.string().optional().describe('https://avatar-url.com'),
});

export class CreateUserDto extends createZodDto(CreateUserSchema) {}
