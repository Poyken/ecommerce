import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export enum SortOption {
  PRICE_ASC = 'price_asc',
  PRICE_DESC = 'price_desc',
  NEWEST = 'newest',
  OLDEST = 'oldest',
  RATING_DESC = 'rating_desc',
}

export class FilterProductDto {
  /**
   * =====================================================================
   * FILTER PRODUCT DTO - Bộ lọc sản phẩm nâng cao
   * =====================================================================
   *
   * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
   *
   * 1. API PROPERTY (@ApiPropertyOptional):
   * - Dùng để generate Swagger/OpenAPI documentation tự động.
   *
   * 2. TYPE TRANSFORMATION (@Type):
   * - Query Params trên URL luôn là string (?minPrice=100).
   * - Cần `@Type(() => Number)` để convert sang số trước khi validate `@IsNumber`.
   *
   * 3. FILTER LOGIC:
   * - Hỗ trợ tìm kiếm, lọc theo Category/Brand, và khoảng giá (Min/Max).
   * - `includeSkus`: Tùy chọn để lấy luôn danh sách biến thể (Màu/Size) hay không. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Tiếp nhận request từ Client, điều phối xử lý và trả về response.

   * =====================================================================
   */
  @ApiPropertyOptional({ description: 'Tìm theo tên hoặc mô tả' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Lọc theo ID danh mục' })
  @IsOptional()
  @IsString()
  categoryId?: string;

  @ApiPropertyOptional({ description: 'Lọc theo ID thương hiệu' })
  @IsOptional()
  @IsString()
  brandId?: string;

  @ApiPropertyOptional({
    description: 'Lọc theo danh sách ID sản phẩm (phân tách bằng dấu phẩy)',
  })
  @IsOptional()
  @IsString()
  ids?: string;

  @ApiPropertyOptional({ description: 'Giá thấp nhất' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @ApiPropertyOptional({ description: 'Giá cao nhất' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @ApiPropertyOptional({ enum: SortOption, description: 'Sắp xếp theo' })
  @IsOptional()
  @IsEnum(SortOption)
  sort?: SortOption;

  @ApiPropertyOptional({
    description: 'Có bao gồm đầy đủ thông tin SKU không (true/false)',
  })
  @IsOptional()
  @IsString()
  includeSkus?: string;

  @ApiPropertyOptional({ description: 'Trang hiện tại', default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Số sản phẩm mỗi trang', default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 10;
}
