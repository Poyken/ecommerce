import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
  IsArray,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * =====================================================================
 * CREATE REVIEW DTO - Đối tượng tạo đánh giá mới
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. RATING SYSTEM:
 * - `@Min(1)` và `@Max(5)`: Giới hạn điểm đánh giá từ 1 đến 5 sao. Đây là quy chuẩn chung của hầu hết các sàn TMĐT.
 *
 * 2. SKU-SPECIFIC REVIEWS:
 * - `skuId`: Cho phép đánh giá chi tiết cho từng biến thể (VD: "Màu xanh rất đẹp nhưng size L hơi rộng").
 * - Nếu không có `skuId`, đánh giá sẽ được tính chung cho toàn bộ sản phẩm.
 *
 * 3. OPTIONAL CONTENT:
 * - `@IsOptional()`: Người dùng có thể chỉ chấm sao mà không cần viết nội dung bình luận.
 *
 * =====================================================================
 */

export class CreateReviewDto {
  @ApiProperty({
    description: 'ID sản phẩm được đánh giá',
    example: 'product-uuid',
  })
  @IsNotEmpty()
  @IsString()
  productId: string;

  @ApiProperty({
    description: 'Số sao đánh giá (1-5)',
    example: 5,
    minimum: 1,
    maximum: 5,
  })
  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @ApiPropertyOptional({
    description: 'Nội dung đánh giá',
    example: 'Sản phẩm rất tốt, giao hàng nhanh!',
  })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({
    description: 'ID SKU cụ thể (nếu đánh giá biến thể)',
    example: 'sku-uuid',
  })
  @IsOptional()
  @IsString()
  skuId?: string;

  @ApiPropertyOptional({
    description: 'Danh sách URL ảnh đính kèm',
    example: ['https://example.com/review1.jpg'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  images?: string[];
}
