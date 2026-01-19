import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

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
 * - Xử lý logic nghiệp vụ, phối hợp các service liên quan để hoàn thành yêu cầu từ Controller.

 * =====================================================================
 */
const CreateBlogSchema = z.object({
  title: z.string().min(1).max(255),
  slug: z.string().min(1),
  excerpt: z.string().min(1),
  content: z.string().min(1),
  image: z.string().optional(),
  category: z.string().min(1),
  author: z.string().optional(),
  language: z.string().optional().describe("'en' or 'vi'"),
  readTime: z.string().optional(),
  productIds: z.array(z.string()).optional(),
});

export class CreateBlogDto extends createZodDto(CreateBlogSchema) {}
