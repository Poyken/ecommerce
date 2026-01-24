import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

/**
 * =====================================================================
 * ASSIGN PERMISSIONS DTO - Đối tượng gán quyền cho vai trò
 * =====================================================================
 *
 * =====================================================================
 */

const AssignPermissionsSchema = z.object({
  permissions: z
    .array(z.string())
    .min(1, 'Permissions list cannot be empty')
    .describe('List of permission IDs'),
});

export class AssignPermissionsDto extends createZodDto(
  AssignPermissionsSchema,
) {}
