import { PartialType } from '@nestjs/swagger';
import { CreateSkuDto } from './create-sku.dto';

/**
 * =====================================================================
 * UPDATE SKU DTO - Đối tượng cập nhật biến thể sản phẩm
 * =====================================================================
 *
 * =====================================================================
 */

export class UpdateSkuDto extends PartialType(CreateSkuDto) {}
