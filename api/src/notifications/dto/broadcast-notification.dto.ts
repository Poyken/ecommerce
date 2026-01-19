import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { NotificationType } from './create-notification.dto';

const BroadcastNotificationSchema = z.object({
  type: z.nativeEnum(NotificationType).describe('Loại thông báo'),
  title: z.string().min(1).describe('Tiêu đề'),
  message: z.string().min(1).describe('Nội dung chi tiết'),
  link: z.string().optional().describe('Đường dẫn liên kết'),
  sendEmail: z.boolean().optional().default(false),
});

export class BroadcastNotificationDto extends createZodDto(
  BroadcastNotificationSchema,
) {}
