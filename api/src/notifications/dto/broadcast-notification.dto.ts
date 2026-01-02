import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { NotificationType } from './create-notification.dto';

export class BroadcastNotificationDto {
  /**
   * =====================================================================
   * BROADCAST NOTIFICATION DTO
   * =====================================================================
   *
   * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
   *
   * USE CASE:
   * - Gửi thông báo cho TOÀN BỘ user (VD: "Bảo trì hệ thống", "Khuyến mãi lớn").
   * - `sendEmail`: Tùy chọn gửi kèm email hay chỉ hiện popup trên web.
   * =====================================================================
   */
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

  @IsBoolean()
  @IsOptional()
  sendEmail?: boolean;
}
