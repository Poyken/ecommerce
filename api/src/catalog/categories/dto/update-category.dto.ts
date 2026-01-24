import { PartialType } from '@nestjs/swagger';
import { CreateCategoryDto } from './create-category.dto';

/**
 * =====================================================================
 * UPDATE CATEGORY DTO - Đối tượng cập nhật danh mục
 * =====================================================================
 *
 * =====================================================================
 */

export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}
