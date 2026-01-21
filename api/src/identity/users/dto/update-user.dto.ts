import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';
import { CreateUserSchema } from './create-user.dto';
import { AssignRolesDto } from './assign-roles.dto';

/**
 * =====================================================================
 * UPDATE USER DTO
 * =====================================================================
 */

const UpdateUserSchema = CreateUserSchema.partial().extend({
  password: z
    .string()
    .min(6, 'Mật khẩu phải ít nhất 6 ký tự')
    .optional()
    .describe('newpassword123'),
});

export class UpdateUserDto extends createZodDto(UpdateUserSchema) {}

export { AssignRolesDto };
