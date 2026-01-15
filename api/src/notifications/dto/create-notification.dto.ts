import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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
 * - Frontend dùng type này để hiện icon tương ứng (vd: Xe tải cho ORDER_SHIPPED). *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Tiếp nhận request từ Client, điều phối xử lý và trả về response.

 * =====================================================================
 */
export class CreateNotificationDto {
  @ApiProperty({ description: 'ID User nhận thông báo' })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({ enum: NotificationType, description: 'Loại thông báo' })
  @IsEnum(NotificationType)
  @IsNotEmpty()
  type: NotificationType;

  @ApiProperty({ description: 'Tiêu đề' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'Nội dung chi tiết' })
  @IsString()
  @IsNotEmpty()
  message: string;

  @ApiPropertyOptional({ description: 'Đường dẫn liên kết' })
  @IsString()
  @IsOptional()
  link?: string;
}
