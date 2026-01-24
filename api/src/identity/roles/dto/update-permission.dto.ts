import { PartialType } from '@nestjs/swagger';
import { CreatePermissionDto } from './create-permission.dto';

/**
 * =====================================================================
 * UPDATE PERMISSION DTO - Đối tượng cập nhật quyền hạn
 * =====================================================================
 *
 * =====================================================================
 */

export class UpdatePermissionDto extends PartialType(CreatePermissionDto) {}
