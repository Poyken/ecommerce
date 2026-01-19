import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

export const AssignRolesSchema = z.object({
  roles: z
    .array(z.string())
    .min(1, 'Roles must not be empty')
    .describe('List of role names required to assign'),
});

export class AssignRolesDto extends createZodDto(AssignRolesSchema) {}
