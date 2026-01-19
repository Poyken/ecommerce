import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

/**
 * =====================================================================
 * SUBSCRIBE DTO - Đối tượng đăng ký nhận tin
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. EMAIL VALIDATION:
 * - `@IsEmail()`: Đảm bảo chuỗi nhập vào phải đúng định dạng email (có @, có tên miền).
 * - Đây là bước kiểm tra quan trọng nhất để tránh rác (Spam) trong danh sách newsletter.
 *
 * 2. CUSTOM ERROR MESSAGES:
 * - Sử dụng thuộc tính `message` để trả về thông báo lỗi thân thiện bằng tiếng Việt cho người dùng Frontend. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Tiếp nhận request từ Client, điều phối xử lý và trả về response.

 * =====================================================================
 */

const SubscribeSchema = z.object({
  email: z
    .string()
    .min(1, 'Email không được để trống')
    .email('Email không hợp lệ')
    .describe('Email đăng ký nhận tin'),
});

export class SubscribeDto extends createZodDto(SubscribeSchema) {}
