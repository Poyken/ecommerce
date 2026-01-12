import { PrismaService } from '@core/prisma/prisma.service';
import { RedisService } from '@core/redis/redis.service';
import { Injectable, Logger } from '@nestjs/common';

/**
 * =====================================================================
 * PERMISSION SERVICE - Centralized Permission Management
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. SINGLE RESPONSIBILITY:
 * - Service này chỉ lo việc quản lý permissions (quyền hạn).
 * - Tách biệt khỏi AuthService để code dễ test và maintain hơn.
 *
 * 2. CACHING STRATEGY:
 * - Permissions ít thay đổi → Cache trong Redis (5 phút).
 * - Khi update quyền → Xóa cache ngay lập tức.
 * - Giảm >80% query vào database cho user authentication.
 *
 * 3. PERMISSION AGGREGATION:
 * - Gộp quyền từ 2 nguồn: Direct Permissions + Role Permissions.
 * - Loại bỏ trùng lặp bằng Set.
 * - Trả về mảng string dễ sử dụng trong Guards. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Tiếp nhận request từ Client, điều phối xử lý và trả về response.

 * =====================================================================
 */

export interface UserWithPermissions {
  id: string;
  permissions: Array<{ permission: { name: string } }>;
  roles: Array<{
    role: {
      permissions: Array<{ permission: { name: string } }>;
    };
  }>;
}

@Injectable()
export class PermissionService {
  private readonly logger = new Logger(PermissionService.name);
  private readonly CACHE_TTL = 300; // 5 minutes
  private readonly CACHE_PREFIX = 'user:permissions:';

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  /**
   * Get all permissions for a user (with caching)
   *
   * @param userId - ID của user
   * @param options - Options for caching behavior
   * @returns Array of permission names (e.g., ['product:read', 'order:create'])
   *
   * @example
   * const perms = await permissionService.getUserPermissions('user-123');
   * // => ['product:read', 'order:create', 'user:read']
   */
  async getUserPermissions(
    userId: string,
    options: { skipCache?: boolean } = {},
  ): Promise<string[]> {
    // Try cache first (unless explicitly skipped)
    if (!options.skipCache) {
      const cached = await this.getCachedPermissions(userId);
      if (cached) {
        this.logger.debug(`Cache HIT for user ${userId}`);
        return cached;
      }
    }

    // Cache miss → Fetch from database
    this.logger.debug(`Cache MISS for user ${userId}, fetching from DB...`);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        permissions: {
          select: {
            permission: {
              select: { name: true },
            },
          },
        },
        roles: {
          select: {
            role: {
              select: {
                permissions: {
                  select: {
                    permission: {
                      select: { name: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      this.logger.warn(`User ${userId} not found when fetching permissions`);
      return [];
    }

    const permissions = this.aggregatePermissions(user);

    // Cache for next time
    await this.cachePermissions(userId, permissions);

    return permissions;
  }

  /**
   * Aggregate permissions from user object (no DB call)
   *
   * Hàm này không gọi DB, chỉ xử lý logic gộp permissions.
   * Dùng khi bạn đã có user object từ query khác.
   *
   * @param user - User object with permissions and roles included
   * @returns Array of unique permission names
   *
   * @example
   * const user = await prisma.user.findUnique({ where: { id }, include: {...} });
   * const perms = permissionService.aggregatePermissions(user);
   */
  aggregatePermissions(user: UserWithPermissions): string[] {
    // Extract direct permissions
    const directPermissions = user.permissions.map((up) => up.permission.name);

    // Extract role-based permissions
    const rolePermissions = user.roles.flatMap((ur) =>
      ur.role.permissions.map((rp) => rp.permission.name),
    );

    // Merge and remove duplicates
    const allPermissions = [
      ...new Set([...directPermissions, ...rolePermissions]),
    ];

    this.logger.debug(
      `Aggregated ${allPermissions.length} permissions for user ${user.id} ` +
        `(${directPermissions.length} direct + ${rolePermissions.length} from roles)`,
    );

    return allPermissions;
  }

  /**
   * Invalidate permission cache for a user
   *
   * Gọi hàm này khi:
   * - User được gán/bỏ role
   * - User được cấp/thu hồi permission trực tiếp
   * - Role's permissions thay đổi
   *
   * @param userId - ID của user cần xóa cache
   */
  async invalidateUserPermissions(userId: string): Promise<void> {
    const cacheKey = this.getCacheKey(userId);
    await this.redis.del(cacheKey);
    this.logger.log(`Invalidated permission cache for user ${userId}`);
  }

  /**
   * Invalidate permission cache for all users with a specific role
   *
   * Dùng khi thay đổi permissions của một role.
   * Tất cả users có role đó cần update cache.
   *
   * @param roleId - ID của role đã thay đổi
   */
  async invalidateRolePermissions(roleId: string): Promise<void> {
    // Lấy tất cả users có role này
    const userRoles = await this.prisma.userRole.findMany({
      where: { roleId },
      select: { userId: true },
    });

    // Xóa cache cho từng user
    const invalidations = userRoles.map((ur) =>
      this.invalidateUserPermissions(ur.userId),
    );

    await Promise.all(invalidations);

    this.logger.log(
      `Invalidated permission cache for ${userRoles.length} users with role ${roleId}`,
    );
  }

  /**
   * Check if user has a specific permission
   *
   * @param userId - ID của user
   * @param permission - Permission name to check (e.g., 'product:delete')
   * @returns true if user has the permission
   *
   * @example
   * const canDelete = await permissionService.hasPermission('user-123', 'product:delete');
   * if (!canDelete) throw new ForbiddenException();
   */
  async hasPermission(userId: string, permission: string): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId);
    return permissions.includes(permission);
  }

  /**
   * Check if user has ALL of the specified permissions
   *
   * @param userId - ID của user
   * @param requiredPermissions - Array of permission names
   * @returns true if user has all permissions
   *
   * @example
   * const canManageProducts = await permissionService.hasAllPermissions('user-123', [
   *   'product:read',
   *   'product:update'
   * ]);
   */
  async hasAllPermissions(
    userId: string,
    requiredPermissions: string[],
  ): Promise<boolean> {
    const userPermissions = await this.getUserPermissions(userId);
    return requiredPermissions.every((perm) => userPermissions.includes(perm));
  }

  /**
   * Check if user has ANY of the specified permissions
   *
   * @param userId - ID của user
   * @param permissions - Array of permission names
   * @returns true if user has at least one permission
   *
   * @example
   * const canViewAdmin = await permissionService.hasAnyPermission('user-123', [
   *   'admin:read',
   *   'admin:update'
   * ]);
   */
  async hasAnyPermission(
    userId: string,
    permissions: string[],
  ): Promise<boolean> {
    const userPermissions = await this.getUserPermissions(userId);
    return permissions.some((perm) => userPermissions.includes(perm));
  }

  // ========== PRIVATE HELPER METHODS ==========

  private getCacheKey(userId: string): string {
    return `${this.CACHE_PREFIX}${userId}`;
  }

  private async getCachedPermissions(userId: string): Promise<string[] | null> {
    const cacheKey = this.getCacheKey(userId);
    const cached = await this.redis.get(cacheKey);

    if (!cached) return null;

    try {
      return JSON.parse(cached) as string[];
    } catch (error) {
      this.logger.error(
        `Failed to parse cached permissions for user ${userId}`,
        error,
      );
      // Xóa cache lỗi
      await this.redis.del(cacheKey);
      return null;
    }
  }

  private async cachePermissions(
    userId: string,
    permissions: string[],
  ): Promise<void> {
    const cacheKey = this.getCacheKey(userId);
    await this.redis.set(
      cacheKey,
      JSON.stringify(permissions),
      'EX',
      this.CACHE_TTL,
    );
  }
}
