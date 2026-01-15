import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

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
 * - `@IsOptional()`: Người dùng có thể chỉ chấm sao mà không cần viết nội dung bình luận. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Tiếp nhận request từ Client, điều phối xử lý và trả về response.

 * =====================================================================
 */

export class CreateReviewDto {
  @IsNotEmpty()
  @IsString()
  productId: string;

  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  skuId?: string;

  @IsOptional()
  @IsString({ each: true })
  images?: string[];
}
