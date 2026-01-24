import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const ToggleWishlistSchema = z.object({
  productId: z.string().uuid({ message: 'ProductId must be a valid UUID' }),
});

export class ToggleWishlistDto extends createZodDto(ToggleWishlistSchema) {}

export const MergeWishlistSchema = z.object({
  productIds: z
    .array(z.string().uuid())
    .max(100, { message: 'Cannot merge more than 100 items at once' }),
});

export class MergeWishlistDto extends createZodDto(MergeWishlistSchema) {}
