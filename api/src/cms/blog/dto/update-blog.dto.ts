import { PartialType } from '@nestjs/swagger';
import { CreateBlogDto } from './create-blog.dto';

/**
 * =====================================================================
 * UPDATE BLOG DTO - Dữ liệu cập nhật bài viết
 * =====================================================================
 *
 * =====================================================================
 */
export class UpdateBlogDto extends PartialType(CreateBlogDto) {}
