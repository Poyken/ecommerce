import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

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

/**
 * =====================================================================
 * CREATE NOTIFICATION DTO - Tạo thông báo mới
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. NOTIFICATION SYSTEM:
 * - Hệ thống thông báo thường hoạt động qua 2 kênh:
 *   + Realtime (WebSocket/Socket.IO): Popup ngay trên màn hình.
 *   + Database: Lưu lại để user xem lại trong "Lịch sử thông báo".
 *
 * 2. NOTIFICATION TYPE:
 * - Enum giúp code dễ đọc hơn string cứng ('ORDER' vs 'PROMOTION').
 * - Frontend dùng type này để hiện icon tương ứng (vd: Xe tải cho ORDER_SHIPPED).
 * =====================================================================
 */
export class CreateNotificationDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsEnum(NotificationType)
  @IsNotEmpty()
  type: NotificationType;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsString()
  @IsOptional()
  link?: string;
}
