import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

const CreateRoleSchema = z.object({
  name: z.string().min(1, 'Name is required').describe('EDITOR'),
  permissions: z
    .array(z.string())
    .optional()
    .describe('List of permission strings'),
});

export class CreateRoleDto extends createZodDto(CreateRoleSchema) {}
