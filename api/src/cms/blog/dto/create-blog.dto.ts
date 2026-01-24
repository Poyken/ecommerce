import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

/**
 * =====================================================================
 * CREATE BLOG DTO - Dữ liệu tạo bài viết mới
 * =====================================================================
 *
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
