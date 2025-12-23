import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

/**
 * =====================================================================
 * CREATE ORDER DTO - Đối tượng tạo đơn hàng mới
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. SHIPPING INFORMATION:
 * - Thu thập các thông tin cần thiết để giao hàng: Tên, Số điện thoại, Địa chỉ.
 * - `@IsNotEmpty()`: Đảm bảo không có đơn hàng nào bị thiếu thông tin liên lạc.
 *
 * 2. SELECTIVE CHECKOUT:
 * - `itemIds`: Cho phép người dùng chọn một vài món trong giỏ hàng để thanh toán thay vì thanh toán toàn bộ.
 * - Nếu `itemIds` trống, hệ thống sẽ mặc định thanh toán tất cả các món trong giỏ.
 *
 * 3. PAYMENT METHOD:
 * - Mặc định là `COD` nếu người dùng không chọn phương thức khác.
 * =====================================================================
 */

export class CreateOrderDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  recipientName: string;

  @ApiProperty({ example: '0987654321' })
  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @ApiProperty({ example: '123 Main St, Hanoi' })
  @IsString()
  @IsNotEmpty()
  shippingAddress: string;

  @ApiProperty({ example: 'COD', required: false })
  @IsString()
  @IsOptional()
  paymentMethod?: string;

  @ApiProperty({ example: ['item-uuid-1', 'item-uuid-2'], required: false })
  @IsOptional()
  itemIds?: string[];

  @ApiProperty({ example: 'SUMMER2025', required: false })
  @IsString()
  @IsOptional()
  couponCode?: string;

  @ApiProperty({ example: 'http://localhost:3000/orders', required: false })
  @IsString()
  @IsOptional()
  returnUrl?: string; // URL to redirect after payment

  @ApiProperty({ example: 'address-uuid', required: false })
  @IsString()
  @IsOptional()
  addressId?: string;
}
