import { PartialType } from '@nestjs/swagger';
import { CreateBrandDto } from './create-brand.dto';

/**
 * =====================================================================
 * UPDATE BRAND DTO - Đối tượng cập nhật thương hiệu
 * =====================================================================
 *
 * =====================================================================
 */

export class UpdateBrandDto extends PartialType(CreateBrandDto) {}
