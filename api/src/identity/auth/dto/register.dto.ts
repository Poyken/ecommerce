import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

/**
 * =====================================================================
 * REGISTER DTO - Đối tượng dữ liệu đăng ký tài khoản
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. USER PROFILE DATA:
 * - Ngoài Email và Mật khẩu, ta yêu cầu thêm `firstName` và `lastName` để cá nhân hóa trải nghiệm người dùng ngay từ đầu.
 *
 * 2. STRING VALIDATION:
 * - `@MinLength(2)` cho tên: Tránh việc người dùng nhập tên quá ngắn hoặc ký tự rác.
 * - `@MinLength(6)` cho mật khẩu: Đảm bảo độ phức tạp tối thiểu.
 *
 * 3. DATA CONSISTENCY:
 * - DTO này đảm bảo rằng mọi tài khoản mới được tạo ra đều có đầy đủ các thông tin cơ bản cần thiết cho hệ thống. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Xử lý logic nghiệp vụ, phối hợp các service liên quan để hoàn thành yêu cầu từ Controller.

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
