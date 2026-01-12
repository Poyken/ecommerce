import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

/**
 * =====================================================================
 * CREATE CATEGORY DTO - Đối tượng tạo danh mục mới
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. SLUG (URL Friendly):
 * - `slug`: Nếu không truyền lên, hệ thống sẽ tự động tạo từ `name`.
 * - Giúp URL trang danh mục đẹp hơn (VD: `/category/dien-thoai` thay vì `/category/123`).
 *
 * 2. PARENT ID (Cấu trúc cây):
 * - `parentId`: Cho phép tạo danh mục con. Nếu để trống, đây sẽ là danh mục cấp cao nhất (Root Category).
 *
 * 3. VALIDATION:
 * - `@IsNotEmpty()`: Tên danh mục là bắt buộc.
 * - `@IsOptional()`: Slug và ParentId là tùy chọn, giúp API linh hoạt hơn.
 * =====================================================================
 */

export class CreateCategoryDto {
  @ApiProperty({ example: 'Electronics' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'electronics', required: false })
  @IsString()
  @IsOptional()
  slug?: string;

  @ApiProperty({ example: 'uuid-parent-id', required: false })
  @IsString()
  @IsOptional()
  parentId?: string;

  @ApiProperty({ example: 'https://cloudinary.com/image.jpg', required: false })
  @IsString()
  @IsOptional()
  imageUrl?: string;
}
