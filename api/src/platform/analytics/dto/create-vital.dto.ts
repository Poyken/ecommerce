/**
 * =====================================================================
 * CREATE VITAL DTO - Web Vitals Data Object
 * =====================================================================
 *
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
