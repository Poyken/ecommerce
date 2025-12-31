import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNotEmpty, IsOptional } from 'class-validator';

/**
 * =====================================================================
 * UPDATE ORDER STATUS DTO - Đối tượng cập nhật trạng thái đơn hàng
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. ENUMERATION (Liệt kê):
 * - `OrderStatus` định nghĩa tất cả các trạng thái có thể có của một đơn hàng.
 * - Giúp code tường minh, tránh việc dùng chuỗi (string) tự do dễ gây lỗi chính tả.
 *
 * 2. STRICT VALIDATION:
 * - `@IsEnum(OrderStatus)`: Đảm bảo admin chỉ có thể chuyển đơn hàng sang các trạng thái hợp lệ đã được định nghĩa trước.
 *
 * 3. SWAGGER INTEGRATION:
 * - `enum: OrderStatus` trong `@ApiProperty` giúp Swagger hiển thị một danh sách chọn (Dropdown) các trạng thái trên giao diện tài liệu API.
 * =====================================================================
 */

import { OrderStatus, PaymentStatus } from '@prisma/client';
export { OrderStatus, PaymentStatus };

export class UpdateOrderStatusDto {
  @ApiProperty({ enum: OrderStatus, example: OrderStatus.PROCESSING })
  @IsNotEmpty()
  @IsEnum(OrderStatus)
  status: OrderStatus;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  notify?: boolean;

  @ApiProperty({
    example: false,
    required: false,
    description: 'Force status update (Admin only)',
  })
  @IsOptional()
  @IsBoolean()
  force?: boolean;

  @ApiProperty({ example: 'Customer changed mind', required: false })
  @IsOptional()
  cancellationReason?: string;

  @ApiProperty({
    enum: PaymentStatus,
    required: false,
    example: PaymentStatus.PAID,
  })
  @IsOptional()
  @IsEnum(PaymentStatus)
  paymentStatus?: PaymentStatus;
}
