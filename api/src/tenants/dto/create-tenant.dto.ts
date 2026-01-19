/**
 * =====================================================================
 * CREATE-TENANT DTO (DATA TRANSFER OBJECT)
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * DTO định nghĩa cấu trúc dữ liệu truyền giữa các layer.
 *
 * 1. MỤC ĐÍCH:
 *    - Validate dữ liệu đầu vào
 *    - Định nghĩa kiểu dữ liệu cho request/response
 *    - Tách biệt dữ liệu API với database entity
 *
 * 2. DECORATORS SỬ DỤNG:
 *    - @IsString(), @IsNumber()...: Validate kiểu dữ liệu
 *    - @IsOptional(): Field không bắt buộc
 *    - @ApiProperty(): Tài liệu Swagger *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Tiếp nhận request từ Client, điều phối xử lý và trả về response.

 * =====================================================================
 */

import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const CreateTenantSchema = z.object({
  name: z.string().min(1, 'Name is required').describe('Furniture Store'),
  domain: z.string().min(1, 'Domain is required').describe('furniture.local'),
  plan: z.enum(['BASIC', 'PRO', 'ENTERPRISE']).describe('BASIC'),
  themeConfig: z
    .record(z.string(), z.any())
    .optional()
    .describe('Theme config object'),
  adminEmail: z.string().optional().describe('admin@example.com'),
  adminPassword: z.string().optional().describe('password123'),
});

export class CreateTenantDto extends createZodDto(CreateTenantSchema) {}
