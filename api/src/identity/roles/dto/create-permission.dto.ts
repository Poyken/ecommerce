import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

/**
 * =====================================================================
 * CREATE PERMISSION DTO - Đối tượng tạo quyền hạn mới
 * =====================================================================
 *
 * =====================================================================
 */

const CreatePermissionSchema = z.object({
  name: z.string().min(1, 'Name is required').describe('product:create'),
});

export class CreatePermissionDto extends createZodDto(CreatePermissionSchema) {}
