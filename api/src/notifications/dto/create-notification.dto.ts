import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export enum NotificationType {
  ORDER = 'ORDER',
  ORDER_PLACED = 'ORDER_PLACED',
  ORDER_SHIPPED = 'ORDER_SHIPPED',
  ORDER_DELIVERED = 'ORDER_DELIVERED',
  ORDER_CANCELLED = 'ORDER_CANCELLED',
  PROMOTION = 'PROMOTION',
  SYSTEM = 'SYSTEM',
  REVIEW = 'REVIEW',
  INFO = 'INFO',
}

const CreateNotificationSchema = z.object({
  userId: z.string().min(1).describe('ID User nhận thông báo'),
  type: z.nativeEnum(NotificationType).describe('Loại thông báo'),
  title: z.string().min(1).describe('Tiêu đề'),
  message: z.string().min(1).describe('Nội dung chi tiết'),
  link: z.string().optional().describe('Đường dẫn liên kết'),
});

export class CreateNotificationDto extends createZodDto(
  CreateNotificationSchema,
) {}
