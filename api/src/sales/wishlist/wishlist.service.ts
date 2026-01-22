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
    // [FIX C1] Use Transaction to prevent Race Condition (TOCTOU)
    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.wishlist.findUnique({
        where: {
          userId_productId: {
            userId,
            productId,
          },
        },
      });

      if (existing) {
        await tx.wishlist.delete({
          where: { id: existing.id },
        });
        return { isWishlisted: false };
      } else {
        await tx.wishlist.create({
          data: {
            userId,
            productId,
            tenantId: getTenant()!.id,
          },
        });
        return { isWishlisted: true };
      }
    });
  }

  async findAll(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.wishlist.findMany({
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
      this.prisma.wishlist.count({ where: { userId } }),
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
    const existing = await this.prisma.wishlist.findUnique({
      where: { userId_productId: { userId, productId } },
    });
    return { isWishlisted: !!existing };
  }

  async count(userId: string) {
    const count = await this.prisma.wishlist.count({
      where: { userId },
    });
    return { count };
  }

  async mergeWishlist(userId: string, productIds: string[]) {
    if (!productIds || !Array.isArray(productIds) || productIds.length === 0) {
      return [];
    }

    const tenantId = getTenant()!.id;

    // [FIX C2] Security: Verify products belong to current tenant
    // Prevent cross-tenant data pollution
    const validProducts = await this.prisma.product.findMany({
      where: {
        id: { in: productIds },
        tenantId,
      },
      select: { id: true },
    });

    const validIds = validProducts.map((p) => p.id);
    const validIdSet = new Set(validIds);

    if (validIds.length === 0) {
      return [];
    }

    // [FIX H3] Performance: Use createMany with skipDuplicates instead of Loop
    // This reduces N queries to 1 query and handles race conditions implicitly
    await this.prisma.wishlist.createMany({
      data: validIds.map((productId) => ({
        userId,
        productId,
        tenantId,
      })),
      skipDuplicates: true,
    });

    // Return format mimicking old behavior but optimized
    return productIds.map((productId) => ({
      productId,
      success: validIdSet.has(productId), // Only successful if valid in this tenant
      alreadyExisted: true, // Simplified: We don't distinguish created vs existed in bulk mode (it's safe)
      error: validIdSet.has(productId)
        ? undefined
        : 'Product not found or invalid',
    }));
  }
}
