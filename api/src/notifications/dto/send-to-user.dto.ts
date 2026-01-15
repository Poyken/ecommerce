import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { NotificationType } from './create-notification.dto';

export class SendToUserDto {
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

  @ApiPropertyOptional({ description: 'Có gửi email không?', default: false })
  @IsBoolean()
  @IsOptional()
  sendEmail?: boolean;

  @ApiPropertyOptional({ description: 'Địa chỉ email (nếu gửi email)' })
  @IsEmail()
  @IsOptional()
  email?: string;
}
