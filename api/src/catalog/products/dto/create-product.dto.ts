import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

/**
 * =====================================================================
 * CREATE PRODUCT DTO
 * =====================================================================
 */

export const CreateOptionSchema = z.object({
  name: z.string().min(1, 'Name is required').describe('Color'),
  values: z
    .array(z.string())
    .min(1)
    .describe('List of values e.g. ["Red", "Blue"]'),
});

export class CreateOptionDto extends createZodDto(CreateOptionSchema) {}

export const CreateProductImageSchema = z.object({
  url: z.string().min(1).describe('https://image-url.com'),
  alt: z.string().optional().describe('Front view'),
  displayOrder: z.number().optional().describe('0'),
});

export class CreateProductImageDto extends createZodDto(
  CreateProductImageSchema,
) {}

export const CreateProductSchema = z.object({
  name: z.string().min(1, 'Name is required').describe('iPhone 15 Pro Max'),
  slug: z.string().optional().describe('iphone-15-pro-max'),
  description: z.string().optional().describe('Flagship phone from Apple...'),
  categoryIds: z
    .array(z.string().uuid())
    .min(1, 'At least one category is required')
    .describe('List of category UUIDs'),
  brandId: z.string().uuid().describe('Brand UUID'),
  options: z.array(CreateOptionSchema).optional().describe('Product options'),
  images: z
    .array(CreateProductImageSchema)
    .optional()
    .describe('Product images'),
  metaTitle: z.string().optional().describe('SEO Title'),
  metaDescription: z.string().optional().describe('SEO Description'),
  metaKeywords: z.string().optional().describe('SEO Keywords'),
});

export class CreateProductDto extends createZodDto(CreateProductSchema) {}
