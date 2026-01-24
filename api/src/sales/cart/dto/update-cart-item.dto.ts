import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

/**
 * =====================================================================
 * UPDATE CART ITEM DTO - Đối tượng cập nhật số lượng trong giỏ
 * =====================================================================
 *
 * =====================================================================
 */

const UpdateCartItemSchema = z.object({
  quantity: z.number().int().min(1).describe('2'),
});

export class UpdateCartItemDto extends createZodDto(UpdateCartItemSchema) {}
