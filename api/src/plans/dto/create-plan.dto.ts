import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

/**
 * =====================================================================
 * CREATE PLAN DTO - Validate dữ liệu tạo gói cước
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. BUSINESS RULES:
 * - `priceMonthly`, `priceYearly`: Phải >= 0 (Không cho phép giá âm).
 * - `slug`: Mã định danh duy nhất (VD: "pro-plan", "starter") dùng để config trong code
 *   thay vì dùng ID (UUID khó nhớ).
 *
 * 2. ZOD VALIDATOR:
 * - Thư viện này tự động kiểm tra dữ liệu đầu vào trước khi đến Controller. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Xử lý logic nghiệp vụ, phối hợp các service liên quan để hoàn thành yêu cầu từ Controller.
 *
 * =====================================================================
 */

const CreatePlanSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).describe('Unique code'),
  description: z.string().optional(),
  priceMonthly: z.number().min(0),
  priceYearly: z.number().min(0),
  currency: z.string().optional(),
  maxProducts: z.number().min(0),
  maxStorage: z.number().min(0),
  transactionFee: z.number().min(0),
  features: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
  isPublic: z.boolean().optional(),
});

export class CreatePlanDto extends createZodDto(CreatePlanSchema) {}
