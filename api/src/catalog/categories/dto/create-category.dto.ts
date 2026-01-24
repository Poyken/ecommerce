import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

/**
 * =====================================================================
 * CREATE CATEGORY DTO - Đối tượng tạo danh mục mới
 * =====================================================================
 *
 * =====================================================================
 */

const CreateCategorySchema = z.object({
  name: z.string().min(1, 'Name is required').describe('Electronics'),
  slug: z.string().optional().describe('electronics'),
  parentId: z.string().optional().describe('uuid-parent-id'),
  imageUrl: z.string().optional().describe('https://cloudinary.com/image.jpg'),
});

export class CreateCategoryDto extends createZodDto(CreateCategorySchema) {}
