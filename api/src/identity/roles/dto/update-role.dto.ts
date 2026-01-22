import { PartialType } from '@nestjs/swagger';
import { CreateRoleDto } from './create-role.dto';

/**
 * =====================================================================
 * UPDATE ROLE DTO - Đối tượng cập nhật vai trò
 * =====================================================================
 *
 * =====================================================================
 */

export class UpdateRoleDto extends PartialType(CreateRoleDto) {}
