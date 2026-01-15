import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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
   * - `sendEmail`: Tùy chọn gửi kèm email hay chỉ hiện popup trên web. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Tiếp nhận request từ Client, điều phối xử lý và trả về response.

   * =====================================================================
   */
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

  @ApiPropertyOptional({ description: 'Có gửi email không?', default: false })
  @IsBoolean()
  @IsOptional()
  sendEmail?: boolean;
}
