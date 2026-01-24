import { SetMetadata } from '@nestjs/common';

/**
 * =====================================================================
 * PERMISSIONS DECORATOR - Decorator đánh dấu quyền truy cập
 * =====================================================================
 *
 * =====================================================================
 */

export const PERMISSIONS_KEY = 'permissions';
export const Permissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
