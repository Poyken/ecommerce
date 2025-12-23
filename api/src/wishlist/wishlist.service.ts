import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class WishlistService {
  constructor(private readonly prisma: PrismaService) {}

  async toggle(userId: string, productId: string) {
    const existing = await this.prisma.wishlist.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    });

    if (existing) {
      await this.prisma.wishlist.delete({
        where: { id: existing.id },
      });
      return { isWishlisted: false };
    } else {
      await this.prisma.wishlist.create({
        data: {
          userId,
          productId,
        },
      });
      return { isWishlisted: true };
    }
  }

  async findAll(userId: string) {
    return this.prisma.wishlist.findMany({
      where: { userId },
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
            category: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
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
        const existing = await this.prisma.wishlist.findUnique({
          where: {
            userId_productId: {
              userId,
              productId,
            },
          },
        });

        if (!existing) {
          await this.prisma.wishlist.create({
            data: { userId: userId, productId: productId },
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
