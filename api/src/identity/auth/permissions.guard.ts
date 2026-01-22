import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

/**
 * =====================================================================
 * PERMISSIONS GUARD - Lớp kiểm tra quyền hạn chi tiết (RBAC)
 * =====================================================================
 *
 * =====================================================================
 */
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from './decorators/permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // 1. Lấy danh sách quyền yêu cầu (Metadata) từ @Permissions() trên Handler hoặc Class
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Nếu API không yêu cầu quyền gì -> Cho qua
    if (!requiredPermissions) {
      return true;
    }

    // 2. Lấy User từ Request (Đã được JwtStrategy decode và gán vào)
    const { user } = context.switchToHttp().getRequest();

    // [PLATFORM ADMIN BYPASS]
    // Only Platform Admins (Super Admins with 'superAdmin:read' permission) bypass all checks.
    // Regular tenant admins MUST have explicit permissions in their token.
    if (
      user?.roles?.includes('SUPERADMIN') &&
      user?.permissions?.includes('super-admin:read')
    ) {
      return true;
    }

    // Lấy quyền của user từ trong Payload của Token (Stateless - Không cần query DB)
    const userPermissions = user?.permissions || [];

    // 3. Kiểm tra xem User có ít nhất một quyền khớp với yêu cầu không (Logic OR)
    // Nếu bạn muốn yêu cầu phải có TẤT CẢ quyền (Logic AND), hãy đổi .some() thành .every()
    const hasPermission = requiredPermissions.every((permission) =>
      userPermissions.includes(permission),
    );

    if (!hasPermission) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
