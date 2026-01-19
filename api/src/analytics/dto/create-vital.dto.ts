/**
 * =====================================================================
 * CREATE VITAL DTO - Web Vitals Data Object
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. GOOGLE WEB VITALS:
 * - Đây là các chỉ số đo lường UX do Google định nghĩa.
 * - FCP (First Contentful Paint): Tốc độ hiển thị.
 * - LCP (Largest Contentful Paint): Tốc độ hiển thị nội dung chính.
 * - CLS (Cumulative Layout Shift): Độ ổn định giao diện.
 * - INP (Interaction to Next Paint): Độ phản hồi.
 *
 * 2. DATA COLLECTION:
 * - DTO này định nghĩa cấu trúc dữ liệu mà Frontend gửi về để Server lưu trữ. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Xử lý logic nghiệp vụ, phối hợp các service liên quan để hoàn thành yêu cầu từ Controller.

 * =====================================================================
 */
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const CreateVitalSchema = z.object({
  id: z.string().optional().describe('Metric ID (v2-...)'),
  name: z.string().describe('Metric Name (FCP, LCP, CLS, TTFB, FID, INP)'),
  value: z.number().describe('Metric Value'),
  rating: z.string().describe('Metric Rating (good, needs-improvement, poor)'),
  navigationType: z
    .string()
    .optional()
    .describe('Navigation Type (navigate, reload, back_forward)'),
  userAgent: z.string().optional().describe('User Agent'),
  url: z.string().optional().describe('Page URL'),
});

export class CreateVitalDto extends createZodDto(CreateVitalSchema) {}
