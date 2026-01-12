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

  @IsBoolean()
  @IsOptional()
  sendEmail?: boolean;

  @IsEmail()
  @IsOptional()
  email?: string;
}
