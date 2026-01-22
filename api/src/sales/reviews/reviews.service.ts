import { NotificationsGateway } from '@/notifications/notifications.gateway';
import { NotificationsService } from '@/notifications/notifications.service';
import { PrismaService } from '@core/prisma/prisma.service';
import { getTenant } from '@core/tenant/tenant.context';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { Review } from '@prisma/client';
import type { Cache } from 'cache-manager';
import { BaseCrudService } from '@/common/base-crud.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { AiSentimentService } from './ai-sentiment.service';
import { FilterReviewDto } from './dto/filter-review.dto';
import { createPaginatedResult } from '@/common/dto/base.dto';

/**
 * =====================================================================
 * REVIEWS SERVICE - QUẢN LÝ ĐÁNH GIÁ SẢN PHẨM
 * =====================================================================
 *
 * =====================================================================
 */

@Injectable()
export class ReviewsService extends BaseCrudService<
  Review,
  CreateReviewDto,
  UpdateReviewDto
> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly notificationsGateway: NotificationsGateway,
    private readonly aiSentimentService: AiSentimentService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    super(ReviewsService.name);
  }

  protected get model() {
    return this.prisma.review;
  }

  /* ... Custom logic for invalidating cache ... */
  /**
   * Cập nhật Cache điểm đánh giá của sản phẩm (Rating Cache).
   * - Tính toán lại điểm trung bình (`avgRating`) và tổng số đánh giá (`reviewCount`).
   * - Lưu trực tiếp vào bảng `Product` để tối ưu tốc độ đọc (Read-heavy Database Optimization).
   */
  private async updateProductRatingCache(
    productId: string,
    tx: any = this.prisma,
  ) {
    const aggregate = await tx.review.aggregate({
      where: { productId, isApproved: true },
      _avg: { rating: true },
      _count: true,
    });

    await tx.product.update({
      where: { id: productId },
      data: {
        avgRating: aggregate._avg.rating || 0,
        reviewCount: aggregate._count,
      },
    });

    try {
      await this.cacheManager.del(`/api/products/${productId}`);
      const store = (this.cacheManager as any).store; // Cache manager store API not fully typed
      if (store.keys) {
        const keys = await store.keys('products_filter_*');
        if (Array.isArray(keys) && keys.length > 0) {
          await Promise.all(keys.map((k: string) => this.cacheManager.del(k)));
        }
      }
    } catch (error) {
      this.logger.error('Cache invalidation failed', error);
    }
  }

  async create(userId: string, dto: CreateReviewDto) {
    const existing = await this.model.findFirst({
      where: {
        userId,
        productId: dto.productId,
        skuId: dto.skuId || null,
      },
    });

    if (existing) {
      throw new BadRequestException(
        'Bạn đã đánh giá sản phẩm/biến thể này rồi.',
      );
    }

    const whereOrderItems: any = {
      sku: {
        productId: dto.productId,
      },
    };

    if (dto.skuId) {
      whereOrderItems.skuId = dto.skuId;
    }

    const orderHistory = await this.prisma.order.findFirst({
      where: {
        userId,
        status: 'DELIVERED',
        items: {
          some: whereOrderItems,
        },
      },
    });

    if (!orderHistory) {
      throw new BadRequestException(
        'Bạn chỉ có thể đánh giá sản phẩm/biến thể đã mua và đã nhận hàng thành công.',
      );
    }

    /* Transaction đảm bảo tính nhất quán: Tạo review -> Cập nhật điểm rating của Product ngay lập tức */
    const review = await this.prisma.$transaction(async (tx) => {
      const newReview = await tx.review.create({
        data: {
          userId,
          productId: dto.productId,
          skuId: dto.skuId || null,
          rating: dto.rating,
          content: dto.content,
          images: dto.images || [],
          isApproved: true,
          tenantId: getTenant()!.id,
        },
      });

      await this.updateProductRatingCache(dto.productId, tx);

      return newReview;
    });

    // AI Sentiment Analysis (async, không block response)
    if (dto.content && this.aiSentimentService.enabled) {
      this.aiSentimentService
        .analyzeReview(review.id, dto.content, dto.rating)
        .catch((err) => {
          this.logger.error(
            `AI analysis failed for review ${review.id}: ${err.message}`,
          );
        });
    }

    return review;
  }

  /* ... checkEligibility Logic (Complex, Keep as is) ... */
  async checkEligibility(userId: string, productId: string) {
    if (!productId) {
      throw new BadRequestException('productId is required');
    }
    const orderItems = await this.prisma.orderItem.findMany({
      where: {
        order: {
          userId,
          status: 'DELIVERED',
        },
        sku: {
          productId,
        },
      },
      select: {
        sku: {
          select: {
            id: true,
            skuCode: true,
            price: true,
            optionValues: {
              select: {
                optionValue: {
                  select: {
                    id: true,
                    value: true,
                    option: {
                      select: { id: true, name: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    const reviews = await this.model.findMany({
      where: {
        userId,
        productId,
      },
      select: { skuId: true, id: true, rating: true },
    });

    const reviewMap = new Map<string, any>();
    reviews.forEach((r) => {
      if (r.skuId) {
        reviewMap.set(r.skuId, r);
      }
    });

    const skuMap = new Map<string, any>();

    orderItems.forEach((item) => {
      if (!skuMap.has(item.sku.id)) {
        skuMap.set(item.sku.id, {
          ...item.sku,
          review: reviewMap.get(item.sku.id) || null,
        });
      }
    });

    const purchasedSkus = Array.from(skuMap.values());

    return {
      canReview: purchasedSkus.some((s) => !s.review),
      purchasedSkus,
    };
  }

  /* ... Custom findAllByProduct (Cursor pagination pagination riêng cho review) ... */
  /**
   * Lấy danh sách đánh giá của sản phẩm cho User xem.
   * - Sử dụng Cursor-based Pagination (thay vì Offset) để tối ưu hiệu năng cho list dài vô tận (Infinite Scroll).
   * - Trả về kèm thông tin người dùng và biến thể sản phẩm họ đã mua.
   */
  async findAllByProduct(productId: string, cursor?: string, limit = 10) {
    const reviews = await this.model.findMany({
      where: { productId, isApproved: true },
      take: limit + 1,
      skip: cursor ? 1 : 0,
      cursor: cursor ? { id: cursor } : undefined,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        userId: true,
        rating: true,
        content: true,
        images: true,
        createdAt: true,
        reply: true,
        replyAt: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
        sku: {
          select: {
            id: true,
            skuCode: true,
            optionValues: {
              select: {
                optionValue: {
                  select: {
                    id: true,
                    value: true,
                    imageUrl: true,
                    option: {
                      select: { id: true, name: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    let nextCursor: string | undefined = undefined;
    if (reviews.length > limit) {
      const nextItem = reviews.pop();
      nextCursor = nextItem!.id;
    }

    const productStats = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { avgRating: true, reviewCount: true },
    });

    return {
      data: reviews,
      meta: {
        totalReviews: productStats?.reviewCount || 0,
        averageRating: productStats?.avgRating || 0,
        nextCursor,
      },
    };
  }

  /* ... Generic findAll cho Admin ... */
  async findAll(query: FilterReviewDto) {
    const { page = 1, limit = 10, rating, status, search } = query;
    const skip = (page - 1) * limit;

    // Xây dựng bộ lọc tùy chỉnh
    const where: any = {
      deletedAt: null,
    };
    if (rating) where.rating = rating;
    if (status) {
      if (status === 'published') where.isApproved = true;
      if (status === 'hidden') where.isApproved = false;
    }
    if (search) {
      where.OR = [
        { content: { contains: search, mode: 'insensitive' } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { user: { firstName: { contains: search, mode: 'insensitive' } } },
        { user: { lastName: { contains: search, mode: 'insensitive' } } },
        { product: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [items, total] = await Promise.all([
      (this.model as any).findMany({
        where,
        skip,
        take: limit,
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
          product: { select: { id: true, name: true } },
          sku: { select: { id: true, skuCode: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      (this.model as any).count({ where }),
    ]);

    return createPaginatedResult(items, total, page, limit);
  }

  async updateStatus(id: string, isApproved: boolean) {
    const review = await this.findOneBase(id);

    return this.prisma.$transaction(async (tx) => {
      const updated = await (tx.review as any).update({
        where: { id },
        data: { isApproved },
      });
      await this.updateProductRatingCache(review.productId, tx);
      return updated;
    });
  }

  async update(userId: string, id: string, dto: UpdateReviewDto) {
    const review = await this.findOneBase(id);

    if (review.userId !== userId) {
      throw new BadRequestException(
        'Bạn không có quyền chỉnh sửa đánh giá này',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedReview = await (tx.review as any).update({
        where: { id },
        data: {
          rating: dto.rating,
          content: dto.content,
          images: dto.images,
        },
      });

      await this.updateProductRatingCache(review.productId, tx);

      return updatedReview;
    });
  }

  async remove(id: string) {
    const review = await this.findOneBase(id);

    await this.prisma.$transaction(async (tx) => {
      await (tx.review as any).update({
        where: { id },
        data: { deletedAt: new Date() } as any,
      });
      await this.updateProductRatingCache(review.productId, tx);
    });

    return { success: true };
  }

  async removeOwn(userId: string, id: string) {
    const review = await this.findOneBase(id);

    if (review.userId !== userId) {
      throw new BadRequestException('Bạn không có quyền xóa đánh giá này');
    }

    await this.prisma.$transaction(async (tx) => {
      await (tx.review as any).update({
        where: { id },
        data: { deletedAt: new Date() } as any,
      });
      await this.updateProductRatingCache(review.productId, tx);
    });

    return { success: true };
  }

  async replyToReview(id: string, reply: string) {
    const review = await this.model.findUnique({
      where: { id },
      include: { product: true },
    }); // Need product info, using wrapper

    if (!review) {
      throw new BadRequestException('Đánh giá không tồn tại');
    }

    const updatedReview = await this.model.update({
      where: { id },
      data: {
        reply,
        replyAt: new Date(),
      },
    });

    try {
      const notification = await this.notificationsService.create({
        userId: review.userId,
        tenantId: review.tenantId,
        type: 'REVIEW_REPLY',
        title: 'Phản hồi đánh giá',
        message: `Admin đã trả lời đánh giá của bạn về sản phẩm ${review.product.name}`,
        link: `/products/${review.product.slug}`,
      });

      this.notificationsGateway.sendNotificationToUser(
        review.userId,
        notification,
      );
    } catch (error) {
      this.logger.error('Failed to send notification for review reply', error);
    }

    return updatedReview;
  }
}
