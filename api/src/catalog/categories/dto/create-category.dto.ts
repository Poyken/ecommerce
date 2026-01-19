import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

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
 * - `@IsOptional()`: Slug và ParentId là tùy chọn, giúp API linh hoạt hơn. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Tiếp nhận request từ Client, điều phối xử lý và trả về response.

 * =====================================================================
 */

const CreateCategorySchema = z.object({
  name: z.string().min(1, 'Name is required').describe('Electronics'),
  slug: z.string().optional().describe('electronics'),
  parentId: z.string().optional().describe('uuid-parent-id'),
  imageUrl: z.string().optional().describe('https://cloudinary.com/image.jpg'),
});

export class CreateCategoryDto extends createZodDto(CreateCategorySchema) {}
