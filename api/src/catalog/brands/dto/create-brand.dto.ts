import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

/**
 * =====================================================================
 * CREATE BRAND DTO - Đối tượng tạo thương hiệu mới
 * =====================================================================
 *
 * =====================================================================
 */

const CreateBrandSchema = z.object({
  name: z.string().min(1, 'Name is required').describe('Apple'),
  imageUrl: z.string().optional().describe('https://cloudinary.com/image.jpg'),
});

export class CreateBrandDto extends createZodDto(CreateBrandSchema) {}
