import { createZodDto } from 'nestjs-zod';
import { CreateProductSchema } from './create-product.dto';

/**
 * =====================================================================
 * UPDATE PRODUCT DTO - Đối tượng cập nhật sản phẩm
 * =====================================================================
 *
 * =====================================================================
 */

const UpdateProductSchema = CreateProductSchema.partial();

export class UpdateProductDto extends createZodDto(UpdateProductSchema) {}
