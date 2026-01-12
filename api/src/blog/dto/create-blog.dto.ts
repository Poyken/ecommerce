import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

/**
 * =====================================================================
 * CREATE BLOG DTO - Dữ liệu tạo bài viết mới
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. SEO OPTIMIZATION:
 * - `slug`: Đường dẫn URL (vd: /blog/bai-viet-hay). Trường này bắt buộc và thường được
 *   tự động tạo từ `title` nếu Frontend không gửi lên (xử lý ở Service).
 * - `excerpt`: Đoạn trích ngắn hiển thị trên thẻ bài viết hoặc kết quả Google.
 *
 * 2. VALIDATION RULES:
 * - `MaxLength(255)`: Tiêu đề không nên quá dài để tránh vỡ giao diện hoặc lỗi SEO.
 * - `IsOptional()`: Các trường như `image`, `readTime` có thể trống.
 *
 * 3. RELATIONS:
 * - `productIds`: Bài viết có thể "gắn" (tag) các sản phẩm liên quan để User click mua ngay.
 *   Dùng mảng UUID string. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Tiếp nhận request từ Client, điều phối xử lý và trả về response.

 * =====================================================================
 */
export class CreateBlogDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  title: string;

  @IsString()
  @IsNotEmpty()
  slug: string;

  @IsString()
  @IsNotEmpty()
  excerpt: string;

  @IsString()
  @IsNotEmpty()
  content: string;

  @IsString()
  @IsOptional()
  image?: string;

  @IsString()
  @IsNotEmpty()
  category: string;

  @IsString()
  @IsOptional()
  author: string;

  @IsString()
  @IsOptional()
  language?: string; // 'en' or 'vi'

  @IsString()
  @IsOptional()
  readTime?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  productIds?: string[]; // Featured products
}
