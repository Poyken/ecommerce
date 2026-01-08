import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';

/**
 * =====================================================================
 * CREATE PRODUCT DTO - Đối tượng tạo sản phẩm mới
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. NESTED VALIDATION (Kiểm tra lồng nhau):
 * - `@ValidateNested()`: Cho phép kiểm tra các object con nằm trong object cha.
 * - `@Type(() => CreateOptionDto)`: Cần thiết để `class-transformer` biết cách chuyển đổi dữ liệu thô sang class tương ứng trước khi validate.
 *
 * 2. PRODUCT OPTIONS:
 * - `options`: Cho phép định nghĩa các thuộc tính của sản phẩm (VD: Màu sắc, Kích thước) ngay khi tạo sản phẩm.
 * - Đây là bước chuẩn bị dữ liệu để sau này tạo ra các SKU (Biến thể) tương ứng.
 *
 * 3. RELATIONSHIPS:
 * - `categoryId` và `brandId`: Sử dụng `@IsUUID()` để đảm bảo sản phẩm luôn được gắn vào một danh mục và thương hiệu hợp lệ.
 * =====================================================================
 */

export class CreateOptionDto {
  @ApiProperty({ example: 'Color' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: ['Red', 'Blue'] })
  @IsArray()
  @IsString({ each: true })
  values: string[];
}

export class CreateProductImageDto {
  @ApiProperty({ example: 'https://image-url.com' })
  @IsString()
  url: string;

  @ApiProperty({ example: 'Front view', required: false })
  @IsString()
  @IsOptional()
  alt?: string;

  @ApiProperty({ example: 0, required: false })
  @IsOptional()
  displayOrder?: number;
}

export class CreateProductDto {
  @ApiProperty({ example: 'iPhone 15 Pro Max' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'iphone-15-pro-max', required: false })
  @IsString()
  @IsOptional()
  slug?: string;

  @ApiProperty({ example: 'Flagship phone from Apple...' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: ['uuid-category-id'] })
  @IsArray()
  @IsUUID('all', { each: true })
  @IsNotEmpty()
  categoryIds: string[];

  @ApiProperty({ example: 'uuid-brand-id' })
  @IsUUID()
  @IsNotEmpty()
  brandId: string;

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

  @ApiProperty({ example: 'SEO Title', required: false })
  @IsString()
  @IsOptional()
  metaTitle?: string;

  @ApiProperty({ example: 'SEO Description', required: false })
  @IsString()
  @IsOptional()
  metaDescription?: string;

  @ApiProperty({ example: 'iphone, apple, phone', required: false })
  @IsString()
  @IsOptional()
  metaKeywords?: string;
}
