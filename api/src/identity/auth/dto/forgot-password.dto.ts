import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

/**
 * =====================================================================
 * FORGOT PASSWORD DTO - Đối tượng yêu cầu khôi phục mật khẩu
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. IDENTITY VERIFICATION:
 * - `email`: Là thông tin duy nhất cần thiết để hệ thống xác định người dùng đang yêu cầu khôi phục mật khẩu.
 *
 * 2. VALIDATION:
 * - `@IsEmail()`: Đảm bảo email nhập vào có cấu trúc đúng, tránh gửi yêu cầu vô ích lên server.
 * - Thông báo lỗi tiếng Việt giúp cải thiện trải nghiệm người dùng ngay từ bước nhập liệu.
 *
 * 3. PROCESS FLOW:
 * - Sau khi nhận được email hợp lệ, server sẽ tạo một Token và gửi vào email này để người dùng có thể thực hiện bước `reset-password`. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Xử lý logic nghiệp vụ, phối hợp các service liên quan để hoàn thành yêu cầu từ Controller.

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
