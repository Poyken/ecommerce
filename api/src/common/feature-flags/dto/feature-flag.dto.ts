import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

/**
 * =====================================================================
 * FEATURE FLAG DTO - Quản lý Cờ tính năng
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. RULES (JSONB):
 * - Trường `rules` lưu cấu hình phức tạp (dạng JSON).
 * - Ví dụ: `{ "percentage": 20 }` nghĩa là chỉ bật cho 20% user random.
 * - Ví dụ: `{ "environments": ["dev", "staging"] }` nghĩa là chỉ bật ở Dev/Staging.
 *
 * 2. ENABLED VS RULES:
 * - `isEnabled` là công tắc tổng. Nếu `false`, tính năng tắt hoàn toàn.
 * - Nếu `true`, hệ thống mới xét tiếp đến `rules` để quyết định bật cho ai. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Xử lý logic nghiệp vụ, phối hợp các service liên quan để hoàn thành yêu cầu từ Controller.

 * =====================================================================
 */
const CreateFeatureFlagSchema = z.object({
  key: z.string().min(1).describe('new_checkout_flow'),
  description: z.string().optional().describe('Enable the new checkout UI'),
  isEnabled: z.boolean().optional().default(false),
  rules: z.any().optional().describe('{ "percentage": 50 }'),
});
export class CreateFeatureFlagDto extends createZodDto(
  CreateFeatureFlagSchema,
) {}

export class UpdateFeatureFlagDto extends createZodDto(
  CreateFeatureFlagSchema.partial(),
) {}
