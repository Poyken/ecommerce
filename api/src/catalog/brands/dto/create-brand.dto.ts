import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

/**
 * =====================================================================
 * CREATE BRAND DTO - Đối tượng tạo thương hiệu mới
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. SIMPLE VALIDATION:
 * - Chỉ yêu cầu trường `name` là chuỗi và không được để trống.
 * - Các thông tin khác (như Logo) có thể được bổ sung sau hoặc xử lý qua một API tải ảnh riêng. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Tiếp nhận request từ Client, điều phối xử lý và trả về response.

 * =====================================================================
 */

const CreateBrandSchema = z.object({
  name: z.string().min(1, 'Name is required').describe('Apple'),
  imageUrl: z.string().optional().describe('https://cloudinary.com/image.jpg'),
});

export class CreateBrandDto extends createZodDto(CreateBrandSchema) {}
