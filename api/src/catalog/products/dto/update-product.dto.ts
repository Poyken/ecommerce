import { ApiProperty, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsOptional, ValidateNested } from 'class-validator';
import {
  CreateOptionDto,
  CreateProductDto,
  CreateProductImageDto,
} from './create-product.dto';

/**
 * =====================================================================
 * UPDATE PRODUCT DTO - Đối tượng cập nhật sản phẩm
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. PARTIAL UPDATES:
 * - `PartialType(CreateProductDto)`: Biến tất cả các trường từ DTO tạo mới thành tùy chọn.
 * - Cho phép Admin chỉ cập nhật một vài thông tin (VD: chỉ đổi tên sản phẩm) mà không cần gửi lại toàn bộ dữ liệu.
 *
 * 2. OPTIONS OVERRIDE:
 * - Ta định nghĩa lại trường `options` ở đây để đảm bảo nó vẫn được validate đúng kiểu `CreateOptionDto` khi cập nhật. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Tiếp nhận request từ Client, điều phối xử lý và trả về response.

 * =====================================================================
 */

export class UpdateProductDto extends PartialType(CreateProductDto) {
  @ApiProperty({ type: [CreateOptionDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOptionDto)
  options?: CreateOptionDto[];

  @ApiProperty({ type: [CreateProductImageDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProductImageDto)
  images?: CreateProductImageDto[];
}
