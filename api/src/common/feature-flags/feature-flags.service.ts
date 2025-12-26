import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger } from '@nestjs/common';
import type { Cache } from 'cache-manager';
import { PrismaService } from '@core/prisma/prisma.service';
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
  ) {}

  /**
   * Check if a feature flag is enabled for a given context
   */
  async isEnabled(
    key: string,
    context?: { userId?: string; environment?: string },
  ): Promise<boolean> {
    try {
      // 1. Check Cache first
      const cached = await this.cacheManager.get<any>(
        `${this.CACHE_PREFIX}${key}`,
      );
      let flag = cached;

      if (!flag) {
        // 2. Fallback to DB
        flag = await this.prisma.featureFlag.findUnique({
          where: { key },
        });

        if (!flag) return false;

        // 3. Cache it (TTL 1 minute for flags to keep them relatively fresh but fast)
        await this.cacheManager.set(`${this.CACHE_PREFIX}${key}`, flag, 60000);
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
    await this.cacheManager.del(`${this.CACHE_PREFIX}${dto.key}`);
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
    await this.cacheManager.del(`${this.CACHE_PREFIX}${key}`);
    return flag;
  }

  /**
   * Admin: Delete a flag
   */
  async remove(key: string) {
    await this.prisma.featureFlag.delete({ where: { key } });
    await this.cacheManager.del(`${this.CACHE_PREFIX}${key}`);
    return { success: true };
  }

  /**
   * Get all enabled flags for a given context (used by Frontend)
   */
  async getEnabledFlagsForContext(context: {
    userId?: string;
    environment?: string;
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
