import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

/**
 * =====================================================================
 * UPDATE CART ITEM DTO - Đối tượng cập nhật số lượng trong giỏ
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. QUANTITY UPDATE:
 * - DTO này chỉ tập trung vào việc thay đổi số lượng (`quantity`) của một item đã tồn tại.
 * - `@Min(1)`: Đảm bảo số lượng luôn lớn hơn hoặc bằng 1. Nếu muốn xóa sản phẩm, user nên dùng API Delete thay vì chỉnh số lượng về 0.
 *
 * 2. TYPE SAFETY:
 * - `@IsInt()`: Đảm bảo số lượng phải là số nguyên, không chấp nhận số thập phân.
 * =====================================================================
 */

export class UpdateCartItemDto {
  @ApiProperty({ example: 2 })
  @IsInt()
  @Min(1)
  quantity: number;
}
