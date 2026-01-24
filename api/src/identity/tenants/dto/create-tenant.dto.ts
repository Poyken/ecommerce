/**
 * =====================================================================
 * CREATE-TENANT DTO (DATA TRANSFER OBJECT)
 * =====================================================================
 *
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
