import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { NotificationType } from './create-notification.dto';

/**
 * =====================================================================
 * SEND TO USER DTO
 * =====================================================================
 *
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
