import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsUUID, Min } from 'class-validator';

/**
 * =====================================================================
 * ADD TO CART DTO - Đối tượng truyền dữ liệu thêm vào giỏ hàng
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. DATA VALIDATION:
 * - Sử dụng `class-validator` để kiểm tra dữ liệu đầu vào ngay tại tầng DTO.
 * - `@IsUUID()`: Đảm bảo `skuId` phải là định dạng UUID hợp lệ.
 * - `@Min(1)`: Ngăn chặn việc thêm số lượng bằng 0 hoặc số âm vào giỏ hàng.
 *
 * 2. SWAGGER DOCUMENTATION:
 * - `@ApiProperty()`: Dùng để mô tả trường dữ liệu cho tài liệu API tự động (Swagger).
 * - Giúp các bạn làm Frontend biết được cấu trúc dữ liệu cần gửi lên mà không cần đọc code logic.
 * =====================================================================
 */

export class AddToCartDto {
  @ApiProperty({ example: 'uuid-sku-id' })
  @IsUUID()
  @IsNotEmpty()
  skuId: string;

  @ApiProperty({ example: 1 })
  @IsInt()
  @Min(1)
  quantity: number;
}
