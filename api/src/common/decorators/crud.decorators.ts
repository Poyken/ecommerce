/**
 * =====================================================================
 * CRUD DECORATORS - Decorators cho các Controller patterns phổ biến
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. DECORATOR COMPOSITION:
 * - NestJS sử dụng decorators để khai báo metadata cho routes.
 * - File này tạo các composite decorators để giảm boilerplate.
 *
 * 2. API DOCUMENTATION:
 * - Tự động thêm Swagger decorators cho documentation.
 * =====================================================================
 */

import { applyDecorators, SetMetadata, Type } from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';

// =============================================================================
// API RESPONSE DECORATORS
// =============================================================================

/**
 * Decorator cho List endpoint với pagination.
 */
export function ApiListResponse(
  entityName: string,
  entityType?: Type<unknown>,
) {
  return applyDecorators(
    ApiOperation({ summary: `Lấy danh sách ${entityName}` }),
    ApiResponse({
      status: 200,
      description: `Danh sách ${entityName} với phân trang`,
    }),
    ApiQuery({ name: 'page', required: false, type: Number }),
    ApiQuery({ name: 'limit', required: false, type: Number }),
    ApiQuery({ name: 'search', required: false, type: String }),
  );
}

/**
 * Decorator cho Get One endpoint.
 */
export function ApiGetOneResponse(entityName: string) {
  return applyDecorators(
    ApiOperation({ summary: `Lấy chi tiết ${entityName}` }),
    ApiResponse({
      status: 200,
      description: `Chi tiết ${entityName}`,
    }),
    ApiResponse({
      status: 404,
      description: `${entityName} không tồn tại`,
    }),
  );
}

/**
 * Decorator cho Create endpoint.
 */
export function ApiCreateResponse(entityName: string) {
  return applyDecorators(
    ApiOperation({ summary: `Tạo ${entityName} mới` }),
    ApiBearerAuth(),
    ApiResponse({
      status: 201,
      description: `${entityName} đã được tạo thành công`,
    }),
    ApiResponse({
      status: 400,
      description: 'Dữ liệu không hợp lệ',
    }),
  );
}

/**
 * Decorator cho Update endpoint.
 */
export function ApiUpdateResponse(entityName: string) {
  return applyDecorators(
    ApiOperation({ summary: `Cập nhật ${entityName}` }),
    ApiBearerAuth(),
    ApiResponse({
      status: 200,
      description: `${entityName} đã được cập nhật`,
    }),
    ApiResponse({
      status: 404,
      description: `${entityName} không tồn tại`,
    }),
  );
}

/**
 * Decorator cho Delete endpoint.
 */
export function ApiDeleteResponse(entityName: string) {
  return applyDecorators(
    ApiOperation({ summary: `Xóa ${entityName}` }),
    ApiBearerAuth(),
    ApiResponse({
      status: 200,
      description: `${entityName} đã được xóa`,
    }),
    ApiResponse({
      status: 404,
      description: `${entityName} không tồn tại`,
    }),
  );
}

// =============================================================================
// CUSTOM METADATA DECORATORS
// =============================================================================

/**
 * Đánh dấu endpoint là public (không cần auth).
 */
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

/**
 * Đánh dấu permissions cần thiết cho endpoint.
 */
export const PERMISSIONS_KEY = 'permissions';
export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

/**
 * Đánh dấu roles cần thiết cho endpoint.
 */
export const ROLES_KEY = 'roles';
export const RequireRoles = (...roles: string[]) =>
  SetMetadata(ROLES_KEY, roles);

/**
 * Đánh dấu endpoint cần refresh CSRF token.
 */
export const SKIP_CSRF_KEY = 'skipCsrf';
export const SkipCsrf = () => SetMetadata(SKIP_CSRF_KEY, true);

// =============================================================================
// THROTTLE DECORATORS
// =============================================================================

/**
 * Đánh dấu endpoint cần rate limit đặc biệt.
 */
export const THROTTLE_LIMIT_KEY = 'throttleLimit';
export const ThrottleLimit = (limit: number, ttl: number) =>
  SetMetadata(THROTTLE_LIMIT_KEY, { limit, ttl });

/**
 * Skip throttling cho endpoint.
 */
export const SKIP_THROTTLE_KEY = 'skipThrottle';
export const SkipThrottle = () => SetMetadata(SKIP_THROTTLE_KEY, true);

// =============================================================================
// CACHE DECORATORS
// =============================================================================

/**
 * Đánh dấu response cache TTL.
 */
export const CACHE_TTL_KEY = 'cacheTtl';
export const CacheTTL = (seconds: number) =>
  SetMetadata(CACHE_TTL_KEY, seconds);

/**
 * Đánh dấu không cache response.
 */
export const NO_CACHE_KEY = 'noCache';
export const NoCache = () => SetMetadata(NO_CACHE_KEY, true);

// =============================================================================
// AUDIT DECORATORS
// =============================================================================

/**
 * Đánh dấu action cần audit logging.
 */
export const AUDIT_ACTION_KEY = 'auditAction';
export const AuditAction = (action: string) =>
  SetMetadata(AUDIT_ACTION_KEY, action);

/**
 * Skip audit logging cho endpoint.
 */
export const SKIP_AUDIT_KEY = 'skipAudit';
export const SkipAudit = () => SetMetadata(SKIP_AUDIT_KEY, true);
