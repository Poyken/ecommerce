import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { NotificationType } from './create-notification.dto';

/**
 * =====================================================================
 * SEND TO USER DTO
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * USE CASE:
 * - Gửi thông báo cho 1 USER CỤ THỂ (VD: "Đơn hàng của bạn đã được giao").
 * - `userId`: Bắt buộc phải có ID người nhận. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Tiếp nhận request từ Client, điều phối xử lý và trả về response.

 * =====================================================================
 */
const SendToUserSchema = z.object({
  userId: z.string().min(1).describe('ID User nhận thông báo'),
  type: z.nativeEnum(NotificationType).describe('Loại thông báo'),
  title: z.string().min(1).describe('Tiêu đề'),
  message: z.string().min(1).describe('Nội dung chi tiết'),
  link: z.string().optional().describe('Đường dẫn liên kết'),
  sendEmail: z
    .boolean()
    .optional()
    .default(false)
    .describe('Có gửi email không?'),
  email: z
    .string()
    .email()
    .optional()
    .describe('Địa chỉ email (nếu gửi email)'),
});

export class SendToUserDto extends createZodDto(SendToUserSchema) {}
