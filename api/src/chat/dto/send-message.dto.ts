import { IsEnum, IsObject, IsOptional, IsString } from 'class-validator';

export class SendMessageDto {
  /**
   * =====================================================================
   * SEND MESSAGE DTO
   * =====================================================================
   *
   * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
   *
   * 1. POLYMORPHIC MESSAGES:
   * - Chat không chỉ có text mà còn có hình ảnh, sản phẩm, đơn hàng.
   * - `type`: Xác định loại tin nhắn để Client biết cách render (hiển thị ảnh hay thẻ sản phẩm).
   * - `metadata`: Chứa thông tin bổ sung (VD: ID đơn hàng, URL ảnh).
   *
   * 2. CLIENT TEMP ID:
   * - Dùng để Optimistic UI (Hiển thị tin nhắn ngay lập tức trước khi Server phản hồi).
   * =====================================================================
   */
  @IsString()
  content: string;

  @IsString()
  @IsOptional()
  toUserId?: string;

  @IsString()
  @IsOptional()
  clientTempId?: string;

  @IsEnum(['TEXT', 'IMAGE', 'PRODUCT', 'ORDER'])
  @IsOptional()
  type?: 'TEXT' | 'IMAGE' | 'PRODUCT' | 'ORDER';

  @IsObject()
  @IsOptional()
  metadata?: any;
}
