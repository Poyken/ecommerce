import {
  SetMetadata,
  createParamDecorator,
  ExecutionContext,
} from '@nestjs/common';
import { getTenant } from './tenant.context';
import { Tenant } from '@prisma/client';

/**
 * =====================================================================
 * TENANT DECORATORS - DECORATOR CHO MULTI-TENANCY
 * =====================================================================
 *
 * =====================================================================
 */

// =====================================================================
// METADATA KEYS
// =====================================================================

/** Key để đánh dấu endpoint yêu cầu tenant context */
export const REQUIRE_TENANT_KEY = 'require_tenant';

/** Key để đánh dấu scope tenant */
export const TENANT_SCOPED_KEY = 'tenant_scoped';

/** Key để skip tenant validation (cho super-admin endpoints) */
export const SKIP_TENANT_CHECK_KEY = 'skip_tenant_check';

// =====================================================================
// CLASS & METHOD DECORATORS
// =====================================================================

/**
 * Đánh dấu controller hoặc method yêu cầu PHẢI có tenant context.
 * Guard sẽ tự động check và throw 403 nếu không có.
 *
 * @example
 * ```typescript
 * @Controller('products')
 * @RequireTenant()
 * export class ProductsController {
 *   // Tất cả endpoints trong controller này đều cần tenant
 * }
 * ```
 *
 * @example
 * ```typescript
 * @Controller('orders')
 * export class OrdersController {
 *   @Get()
 *   @RequireTenant()
 *   findAll() {
 *     // Chỉ endpoint này cần tenant
 *   }
 * }
 * ```
 */
export const RequireTenant = () => SetMetadata(REQUIRE_TENANT_KEY, true);

/**
 * Đánh dấu controller hoặc service hoạt động trong scope của một tenant.
 * Dùng cho documentation và IDE hints.
 *
 * @example
 * ```typescript
 * @Injectable()
 * @TenantScoped()
 * export class CartService {
 *   // Service này chỉ hoạt động khi có tenant context
 * }
 * ```
 */
export const TenantScoped = () => SetMetadata(TENANT_SCOPED_KEY, true);

/**
 * Bỏ qua kiểm tra tenant cho một endpoint cụ thể.
 * Dùng cho các endpoint super-admin cần truy cập cross-tenant.
 *
 * @example
 * ```typescript
 * @Controller('admin/tenants')
 * @RequireTenant() // Controller level
 * export class AdminController {
 *   @Get('all')
 *   @SkipTenantCheck() // Bỏ qua cho endpoint này
 *   getAllTenants() {
 *     // Super admin có thể xem tất cả tenants
 *   }
 * }
 * ```
 */
export const SkipTenantCheck = () => SetMetadata(SKIP_TENANT_CHECK_KEY, true);

// =====================================================================
// PARAMETER DECORATORS
// =====================================================================

/**
 * Inject tenant hiện tại vào parameter của handler.
 * Tự động lấy từ AsyncLocalStorage context.
 *
 * @example
 * ```typescript
 * @Get('profile')
 * getStoreProfile(@CurrentTenant() tenant: Tenant) {
 *   return {
 *     name: tenant.name,
 *     domain: tenant.domain,
 *   };
 * }
 * ```
 *
 * @example
 * ```typescript
 * // Lấy chỉ tenantId
 * @Get('products')
 * getProducts(@CurrentTenant('id') tenantId: string) {
 *   return this.productsService.findByTenant(tenantId);
 * }
 * ```
 */
export const CurrentTenant = createParamDecorator(
  (
    property: keyof Tenant | undefined,
    ctx: ExecutionContext,
  ): Tenant | string | null => {
    const tenant = getTenant();

    if (!tenant) {
      return null;
    }

    // Nếu chỉ định property, trả về giá trị của property đó
    if (property) {
      return tenant[property] as string;
    }

    // Trả về toàn bộ tenant object
    return tenant;
  },
);

/**
 * Inject tenantId vào parameter (shorthand cho @CurrentTenant('id')).
 *
 * @example
 * ```typescript
 * @Post()
 * createProduct(
 *   @TenantId() tenantId: string,
 *   @Body() dto: CreateProductDto
 * ) {
 *   return this.productsService.create(tenantId, dto);
 * }
 * ```
 */
export const TenantId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string | null => {
    const tenant = getTenant();
    return tenant?.id || null;
  },
);
