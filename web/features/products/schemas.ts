import { z } from "zod";

export const GetProductsSchema = z.object({
  limit: z.number().optional(),
  page: z.number().optional(),
  search: z.string().optional(),
  categoryId: z.string().optional(),
  brandId: z.string().optional(),
  ids: z.string().optional(),
  sort: z.string().optional(),
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
  includeSkus: z.string().optional(),
});

export const ProductIdSchema = z.object({
  id: z.string().uuid().or(z.string()),
});

export const LimitSchema = z.object({
  limit: z.number().min(1).max(100).default(12),
});
