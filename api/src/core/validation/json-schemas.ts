import { z } from 'zod';

/**
 * =================================================================================================
 * JSON SCHEMAS - KẾT GIAO GIỮA PRISMA VÀ STRICT TYPING
 * =================================================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. MỤC ĐÍCH:
 *    - Mặc dù Prisma hỗ trợ field `Json`, nhưng nó trả về `any` (không có gợi ý code).
 *    - File này định nghĩa cấu trúc chặt chẽ (Schema) cho các trường JSON quan trọng bằng thư viện `Zod`.
 *
 * 2. LỢI ÍCH:
 *    - Runtime Validation: Đảm bảo dữ liệu trong DB không bị rác (VD: màu phải là hex code).
 *    - Type Inference: Tự động suy diễn kiểu TypeScript từ Schema (`z.infer<typeof Schema>`).
 * =================================================================================================
 */

// 1. Tenant Theme Config
export const ThemeConfigSchema = z.object({
  primaryColor: z
    .string()
    .regex(/^#([0-9A-F]{3}){1,2}$/i, 'Must be a valid hex color')
    .optional(),
  borderRadius: z.string().optional(), // '0.5rem', '4px', etc.
  fontFamily: z.string().optional(),
  logoUrl: z.string().url().optional(),

  // Advanced customization
  layout: z
    .object({
      containerWidth: z.string().optional(), // '1200px'
      spacing: z.string().optional(), // 'compact' | 'normal' | 'relaxed'
    })
    .optional(),
});

export type ThemeConfig = z.infer<typeof ThemeConfigSchema>;

// 2. Page Builder Blocks
const BaseBlockSchema = z.object({
  id: z.string(),
  type: z.string(), // 'Hero', 'PromoGrid', etc.
});

// Define specific props for known blocks
const HeroBlockProps = z.object({
  title: z.string().optional(),
  subtitle: z.string().optional(),
  imageUrl: z.string().optional(),
  ctaText: z.string().optional(),
  ctaLink: z.string().optional(),
  align: z.enum(['left', 'center', 'right']).optional(),
  styles: z
    .object({
      backgroundColor: z.string().optional(),
      textColor: z.string().optional(),
    })
    .optional(),
});

// Generic Block Schema
export const BlockSchema = BaseBlockSchema.extend({
  props: z.union([
    HeroBlockProps,
    z.record(z.string(), z.any()), // Fallback for other blocks
  ]),
});

export const PageBlocksSchema = z.array(BlockSchema);

export type PageBlock = z.infer<typeof BlockSchema>;

/**
 * Helper to validate data safe
 */
export function safeParseJson<T>(schema: z.ZodSchema<T>, data: any): T | null {
  const result = schema.safeParse(data);
  if (result.success) {
    return result.data;
  }
  console.warn('JSON Validation Failed:', result.error);
  return null;
}
