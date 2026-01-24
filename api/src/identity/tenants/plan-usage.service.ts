/**
 * =====================================================================
 * PLAN-USAGE.SERVICE SERVICE
 * =====================================================================
 *
 * =====================================================================
 */

import { PrismaService } from '@core/prisma/prisma.service';
import { getTenant } from '@core/tenant/tenant.context';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { TenantPlan } from '@prisma/client';

export const PLAN_LIMITS = {
  [TenantPlan.BASIC]: {
    PRODUCT_LIMIT: 100,
    BLOG_LIMIT: 5,
    STAFF_LIMIT: 2,
  },
  [TenantPlan.PRO]: {
    PRODUCT_LIMIT: 1000,
    BLOG_LIMIT: 50,
    STAFF_LIMIT: 10,
  },
  [TenantPlan.ENTERPRISE]: {
    PRODUCT_LIMIT: 100000, // Unlimited-ish
    BLOG_LIMIT: 10000,
    STAFF_LIMIT: 1000,
  },
};

import { RedisService } from '@core/redis/redis.service';

@Injectable()
export class PlanUsageService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  private getCacheKey(tenantId: string, type: 'products' | 'staff') {
    return `tenant:${tenantId}:usage:${type}`;
  }

  async checkProductLimit(tenantId: string) {
    const tenant = getTenant();
    if (!tenant || tenant.id !== tenantId) return;

    const limits = PLAN_LIMITS[tenant.plan] || PLAN_LIMITS[TenantPlan.BASIC];
    const cacheKey = this.getCacheKey(tenantId, 'products');

    // 1. Try get from Cache
    let currentCount = Number(await this.redisService.get(cacheKey));

    if (!currentCount && currentCount !== 0) {
      // 2. Cache Miss: Count from DB
      currentCount = await this.prisma.product.count({
        where: { tenantId },
      });
      // Cache for 5 minutes (approximate logic is fine for limits)
      // For strict enforcement, we'd use INCR/DECR, but for this step we Cache-Aside.
      await this.redisService.setex(cacheKey, 300, currentCount.toString());
    }

    if (currentCount >= limits.PRODUCT_LIMIT) {
      throw new ForbiddenException(
        `Bạn đã đạt giới hạn ${limits.PRODUCT_LIMIT} sản phẩm của gói ${tenant.plan}. Vui lòng nâng cấp gói cước.`,
      );
    }

    // Optimistic Update: Increment cache immediately to reflect the new item being added
    // Note: The actual DB insertion happens AFTER this check.
    // If insertion fails, cache might be slightly off (eventual consistency).
    // Better strategy: Invalidate cache on successful creation.
    // For now, allow 1 extra item > invalidation is safer.
    // We will stick to simple check. To be safe, we don't increment here,
    // we let the `ProductsService` INCR or invalidate.
  }

  async checkStaffLimit(tenantId: string) {
    const tenant = getTenant();
    if (!tenant || tenant.id !== tenantId) return;

    const limits = PLAN_LIMITS[tenant.plan] || PLAN_LIMITS[TenantPlan.BASIC];
    const cacheKey = this.getCacheKey(tenantId, 'staff');

    let currentCount = Number(await this.redisService.get(cacheKey));

    if (!currentCount && currentCount !== 0) {
      currentCount = await this.prisma.user.count({
        where: { tenantId },
      });
      await this.redisService.setex(cacheKey, 300, currentCount.toString());
    }

    if (currentCount >= limits.STAFF_LIMIT) {
      throw new ForbiddenException(
        `Bạn đã đạt giới hạn ${limits.STAFF_LIMIT} nhân viên của gói ${tenant.plan}. Vui lòng nâng cấp gói cước.`,
      );
    }
  }

  /**
   * Called after successful creation/deletion to keep cache fresh
   */
  async incrementUsage(tenantId: string, type: 'products' | 'staff') {
    const cacheKey = this.getCacheKey(tenantId, type);
    await this.redisService.incr(cacheKey);
  }

  async decrementUsage(tenantId: string, type: 'products' | 'staff') {
    const cacheKey = this.getCacheKey(tenantId, type);
    // Lua script or conditional decrement to not go below 0?
    // For now simple decrement
    const client = (this.redisService as any).client;
    await client.decr(cacheKey);
  }
}
