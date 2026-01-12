/**
 * =====================================================================
 * FEATURE FLAGS SERVICE - QUẢN LÝ TÍNH NĂNG ĐỘNG (BẬT/TẮT TỨC THÌ)
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. MULTI-LEVEL CACHING (Cấu trúc cache đa tầng):
 * - Vì Feature Flag được check liên tục ở mọi nơi, ta dùng cache 2 lớp để tối ưu:
 *   + Lớp 1 (L1 - RAM): Lưu trên bộ nhớ của Service (15 giây). Cực nhanh, không tốn network.
 *   + Lớp 2 (L2 - Redis): Lưu tập trung cho toàn bộ server (1 giờ).
 *   + Cuối cùng mới đến Database.
 *
 * 2. TARGETING RULES (Quy tắc nhắm mục tiêu):
 * - Hệ thống cho phép bật tính năng theo:
 *   + Environment: Chỉ bật ở Staging, chưa bật ở Production.
 *   + User IDs: Chỉ bật cho một nhóm tester.
 *   + Percentage (%) Rollout: Bật cho 10% người dùng ngẫu nhiên để thử nghiệm (Canary Release).
 *
 * 3. FALLBACK (Cơ chế dự phòng):
 * - Nếu hệ thống cache/DB lỗi, mặc định sẽ trả về `false` (Disabled) để đảm bảo an toàn. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Tiếp nhận request từ Client, điều phối xử lý và trả về response.

 * =====================================================================
 */
import { PrismaService } from '@core/prisma/prisma.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger } from '@nestjs/common';
import type { Cache } from 'cache-manager';
import { CacheL1Service } from '../cache-l1.service';
import {
  CreateFeatureFlagDto,
  UpdateFeatureFlagDto,
} from './dto/feature-flag.dto';

@Injectable()
export class FeatureFlagsService {
  private readonly logger = new Logger(FeatureFlagsService.name);
  private readonly CACHE_PREFIX = 'feature_flag:';

  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly cacheL1: CacheL1Service,
  ) {}

  /**
   * Check if a feature flag is enabled for a given context
   */
  async isEnabled(
    key: string,
    context?: { userId?: string; environment?: string; tenantId?: string },
  ): Promise<boolean> {
    try {
      const cacheKey = `${this.CACHE_PREFIX}${key}`;

      // 1. Check L1 (RAM) Cache first
      const l1Cached = this.cacheL1.get<any>(cacheKey);
      let flag = l1Cached;

      if (!flag) {
        // 2. Check L2 (Redis) Cache
        const cached = await this.cacheManager.get<any>(cacheKey);
        flag = cached;

        if (!flag) {
          // 3. Fallback to DB
          flag = await this.prisma.featureFlag.findUnique({
            where: { key },
          });

          if (!flag) return false;

          // Cache in L2 (Redis) for 1 hour
          await this.cacheManager.set(cacheKey, flag, 3600000);
        }

        // 4. Cache in L1 (RAM) for 15 seconds
        this.cacheL1.set(cacheKey, flag, 15);
      }

      // 4. Basic check
      if (!flag.isEnabled) return false;

      // 5. Rule-based check
      if (flag.rules) {
        const rules = flag.rules;

        // Environment targeting
        if (rules.environments && context?.environment) {
          if (!rules.environments.includes(context.environment)) return false;
        }

        // Tenant targeting
        if (rules.tenantIds && context?.tenantId) {
          if (!rules.tenantIds.includes(context.tenantId)) return false;
        }

        // Specific user targeting
        if (rules.userIds && context?.userId) {
          if (rules.userIds.includes(context.userId)) return true; // Early exit: user explicitly enabled
          if (
            rules.excludeUserIds &&
            rules.excludeUserIds.includes(context.userId)
          )
            return false;
        }

        // Percentage rollout (Deterministic based on userId or random)
        if (rules.percentage !== undefined) {
          if (context?.userId) {
            // Hash userId to getting a consistent percentage bucket (0-99)
            const hash = this.simpleHash(context.userId + key);
            return hash % 100 < rules.percentage;
          }
          // If no userId, return random for this request? Or false? Usually better to stay false for guests if unsure.
          return false;
        }
      }

      return true;
    } catch (error) {
      this.logger.error(`Error checking feature flag ${key}: ${error.message}`);
      return false; // Fail safe: feature disabled if system error
    }
  }

  /**
   * Admin: List all flags
   */
  async findAll() {
    return this.prisma.featureFlag.findMany({
      orderBy: { key: 'asc' },
    });
  }

  /**
   * Admin: Create a new flag
   */
  async create(dto: CreateFeatureFlagDto) {
    const flag = await this.prisma.featureFlag.create({
      data: dto,
    });
    const cacheKey = `${this.CACHE_PREFIX}${dto.key}`;
    await this.cacheManager.del(cacheKey);
    this.cacheL1.delete(cacheKey);
    return flag;
  }

  /**
   * Admin: Update a flag
   */
  async update(key: string, dto: UpdateFeatureFlagDto) {
    const flag = await this.prisma.featureFlag.update({
      where: { key },
      data: dto,
    });
    const cacheKey = `${this.CACHE_PREFIX}${key}`;
    await this.cacheManager.del(cacheKey);
    this.cacheL1.delete(cacheKey);
    return flag;
  }

  /**
   * Admin: Delete a flag
   */
  async remove(key: string) {
    await this.prisma.featureFlag.delete({ where: { key } });
    const cacheKey = `${this.CACHE_PREFIX}${key}`;
    await this.cacheManager.del(cacheKey);
    this.cacheL1.delete(cacheKey);
    return { success: true };
  }

  /**
   * Get all enabled flags for a given context (used by Frontend)
   */
  async getEnabledFlagsForContext(context: {
    userId?: string;
    environment?: string;
    tenantId?: string;
  }) {
    const allFlags = await this.findAll();
    const enabledFlags: string[] = [];

    for (const flag of allFlags) {
      const isEnabled = await this.isEnabled(flag.key, context);
      if (isEnabled) {
        enabledFlags.push(flag.key);
      }
    }

    return enabledFlags;
  }

  /**
   * Simple string hashing for deterministic percentage rollout
   */
  private simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }
}
