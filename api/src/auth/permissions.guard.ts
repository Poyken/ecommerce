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
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. REFLECTOR:
 * - `Reflector` là một công cụ mạnh mẽ của NestJS dùng để đọc các Metadata đã được gắn bởi Decorator (VD: `@Permissions`).
 * - `getAllAndOverride`: Giúp lấy metadata từ hàm (Handler) hoặc từ Class, ưu tiên metadata ở cấp độ hàm.
 *
 * 2. RBAC LOGIC (Role-Based Access Control):
 * - Guard này so sánh danh sách quyền cần thiết của API với danh sách quyền mà người dùng đang có (được lưu trong JWT).
 * - Sử dụng `.every()`: Người dùng phải có TẤT CẢ các quyền được yêu cầu mới được phép truy cập.
 *
 * 3. STATELESS AUTHORIZATION:
 * - Vì danh sách quyền đã nằm sẵn trong Token, ta không cần phải truy vấn Database mỗi khi kiểm tra quyền.
 * - Điều này giúp hệ thống phản hồi cực nhanh và giảm tải cho Database.
 *
 * 4. FORBIDDEN EXCEPTION:
 * - Nếu không đủ quyền, ta ném ra `ForbiddenException` (HTTP 403), khác với `UnauthorizedException` (HTTP 401 - chưa đăng nhập).
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
