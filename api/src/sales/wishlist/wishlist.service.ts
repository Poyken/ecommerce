import { PrismaService } from '@core/prisma/prisma.service';
import { Injectable, Logger } from '@nestjs/common';
import { getTenant } from '@core/tenant/tenant.context';

/**
 * =====================================================================
 * WISHLIST SERVICE - QUẢN LÝ DANH SÁCH YÊU THÍCH
 * =====================================================================
 *
 * =====================================================================
 */
@Injectable()
export class WishlistService {
  private readonly logger = new Logger(WishlistService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * =====================================================================
   * WISHLIST SERVICE - Danh sách yêu thích
   * =====================================================================
   *
   * =====================================================================
   */

  async toggle(userId: string, productId: string) {
    const existing = await (this.prisma.wishlist as any).findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    if (existing) {
      await (this.prisma.wishlist as any).delete({
        where: { id: existing.id },
      });
      return { isWishlisted: false };
    } else {
      try {
        await (this.prisma.wishlist as any).create({
          data: {
            userId,
            productId,
            tenantId: getTenant()!.id,
          },
        });
        return { isWishlisted: true };
      } catch (err) {
        this.logger.error('[WishlistService] create error details:', {
          userId,
          productId,
          error: err,
        });
        throw err;
      }
    }
  }

  async findAll(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      (this.prisma.wishlist as any).findMany({
        where: { userId },
        skip,
        take: limit,
        include: {
          product: {
            include: {
              images: {
                orderBy: { displayOrder: 'asc' },
                take: 1,
              },
              skus: {
                take: 1,
                orderBy: { price: 'asc' },
              },
              categories: {
                include: {
                  category: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      (this.prisma.wishlist as any).count({ where: { userId } }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        lastPage: Math.ceil(total / limit),
      },
    };
  }

  async checkStatus(userId: string, productId: string) {
    const existing = await (this.prisma.wishlist as any).findUnique({
      where: { userId_productId: { userId, productId } },
    });
    return { isWishlisted: !!existing };
  }

  async count(userId: string) {
    const count = await (this.prisma.wishlist as any).count({
      where: { userId },
    });
    return { count };
  }

  async mergeWishlist(userId: string, productIds: string[]) {
    if (!productIds || !Array.isArray(productIds)) {
      return [];
    }
    const results: Array<{
      productId: string;
      success: boolean;
      alreadyExisted?: boolean;
      error?: string;
    }> = [];
    for (const productId of productIds) {
      try {
        // Toggle adds if it doesn't exist. If it exists, it removes it.
        // But for merge, we only want to ADD if it doesn't exist.
        const existing = await (this.prisma.wishlist as any).findUnique({
          where: {
            userId_productId: {
              userId,
              productId,
            },
          },
        });

        if (!existing) {
          await (this.prisma.wishlist as any).create({
            data: {
              userId: userId,
              productId: productId,
              tenantId: getTenant()!.id,
            },
          });
          results.push({ productId: productId, success: true });
        } else {
          results.push({
            productId: productId,
            success: true,
            alreadyExisted: true,
          });
        }
      } catch (error: any) {
        results.push({ productId, success: false, error: error.message });
      }
    }
    return results;
  }
}
