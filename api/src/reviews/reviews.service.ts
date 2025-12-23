import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';

/**
 * =====================================================================
 * REVIEWS SERVICE - Dịch vụ quản lý đánh giá sản phẩm
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. REVIEW ELIGIBILITY (Điều kiện đánh giá):
 * - Đây là logic quan trọng nhất để đảm bảo tính trung thực của đánh giá.
 * - Hệ thống kiểm tra: User phải mua sản phẩm đó (`OrderHistory`) và đơn hàng phải ở trạng thái `DELIVERED`.
 *
 * 2. ANTI-SPAM:
 * - Mỗi người dùng chỉ được đánh giá một lần cho mỗi biến thể sản phẩm (`skuId`).
 * - Sử dụng `findFirst` để kiểm tra sự tồn tại trước khi cho phép tạo mới.
 *
 * 3. AGGREGATION (Tổng hợp dữ liệu):
 * - Sử dụng `prisma.review.aggregate` để tính điểm trung bình (`averageRating`) và tổng số đánh giá của một sản phẩm.
 * - Dữ liệu này cực kỳ quan trọng để hiển thị Social Proof trên Frontend.
 *
 * 4. MODERATION (Kiểm duyệt):
 * - Mặc dù hiện tại `isApproved` đang mặc định là `true`, nhưng cấu trúc đã sẵn sàng để Admin có thể kiểm duyệt nội dung trước khi hiển thị công khai.
 * =====================================================================
 */

import { NotificationsGateway } from '../notifications/notifications.gateway';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ReviewsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  /**
   * Tạo đánh giá sản phẩm.
   * Điều kiện bắt buộc:
   * 1. User đã từng mua sản phẩm này.
   * 2. Đơn hàng chứa sản phẩm phải có trạng thái 'DELIVERED'.
   * 3. Mỗi User chỉ được đánh giá 1 lần cho 1 sản phẩm (tránh spam).
   */
  async create(userId: string, dto: CreateReviewDto) {
    // 1. Kiểm tra User đã đánh giá chưa
    // Check if review exists for this product and sku (or no sku)
    const existing = await this.prisma.review.findFirst({
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

    // 2. Kiểm tra lịch sử mua hàng
    // Tìm đơn hàng của User này, có chứa Product này (và SKU này nếu có), và trạng thái là DELIVERED
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

    // 3. Tạo Review
    return this.prisma.review.create({
      data: {
        userId,
        productId: dto.productId,
        skuId: dto.skuId || null,
        rating: dto.rating,
        content: dto.content,
        images: dto.images || [],
        isApproved: true,
      },
    });
  }

  async checkEligibility(userId: string, productId: string) {
    // Find all delivered order items for this user and product
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
      include: {
        sku: {
          include: {
            optionValues: {
              include: {
                optionValue: {
                  include: { option: true },
                },
              },
            },
          },
        },
      },
    });

    // Find existing reviews
    const reviews = await this.prisma.review.findMany({
      where: {
        userId,
        productId,
      },
    });

    // Map SKU ID to Review
    const reviewMap = new Map<string, any>();
    reviews.forEach((r) => {
      if (r.skuId) {
        reviewMap.set(r.skuId, r);
      }
    });

    // Deduplicate SKUs and attach review status
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
      canReview: purchasedSkus.some((s) => !s.review), // Can review if there's at least one unreviewed SKU
      purchasedSkus, // Return all purchased SKUs with their review status
    };
  }

  /**
   * Lấy danh sách đánh giá của 1 sản phẩm
   */
  async findAllByProduct(productId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where: { productId, isApproved: true },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { firstName: true, lastName: true },
          },
          sku: {
            include: {
              optionValues: {
                include: {
                  optionValue: {
                    include: { option: true },
                  },
                },
              },
            },
          },
        },
      }),
      this.prisma.review.count({
        where: { productId, isApproved: true },
      }),
    ]);

    // Tính điểm trung bình (Tùy chọn)
    const aggregate = await this.prisma.review.aggregate({
      where: { productId, isApproved: true },
      _avg: { rating: true },
      _count: true,
    });

    return {
      data: reviews,
      meta: {
        total,
        page,
        limit,
        lastPage: Math.ceil(total / limit),
        averageRating: aggregate._avg.rating || 0,
        totalReviews: aggregate._count,
      },
    };
  }

  /**
   * Lấy tất cả đánh giá (Admin)
   */
  /**
   * Lấy tất cả đánh giá (Admin)
   */
  async findAll(page: number, limit: number, rating?: number) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (rating) {
      where.rating = rating;
    }

    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { firstName: true, lastName: true, email: true },
          },
          product: {
            select: { id: true, name: true },
          },
          sku: {
            select: { id: true, skuCode: true },
          },
        },
      }),
      this.prisma.review.count({ where }),
    ]);

    return {
      data: reviews,
      meta: {
        total,
        page,
        limit,
        lastPage: Math.ceil(total / limit),
      },
    };
  }

  async update(userId: string, id: string, dto: UpdateReviewDto) {
    const review = await this.prisma.review.findUnique({
      where: { id },
    });

    if (!review) {
      throw new BadRequestException('Đánh giá không tồn tại');
    }

    if (review.userId !== userId) {
      throw new BadRequestException(
        'Bạn không có quyền chỉnh sửa đánh giá này',
      );
    }

    return this.prisma.review.update({
      where: { id },
      data: {
        rating: dto.rating,
        content: dto.content,
        images: dto.images,
        // Usually we don't allow changing SKU or Product ID after creation
      },
    });
  }

  // Dành cho Admin: Duyệt hoặc Xóa review
  async remove(id: string) {
    return this.prisma.review.delete({ where: { id } });
  }

  async removeOwn(userId: string, id: string) {
    const review = await this.prisma.review.findUnique({
      where: { id },
    });

    if (!review) {
      throw new BadRequestException('Đánh giá không tồn tại');
    }

    if (review.userId !== userId) {
      throw new BadRequestException('Bạn không có quyền xóa đánh giá này');
    }

    return this.prisma.review.delete({ where: { id } });
  }

  /**
   * Admin trả lời đánh giá
   */
  async replyToReview(id: string, reply: string) {
    const review = await this.prisma.review.findUnique({
      where: { id },
      include: { product: true },
    });

    if (!review) {
      throw new BadRequestException('Đánh giá không tồn tại');
    }

    const updatedReview = await this.prisma.review.update({
      where: { id },
      data: {
        reply,
        replyAt: new Date(),
      },
    });

    // Gửi thông báo cho user
    try {
      const notification = await this.notificationsService.create({
        userId: review.userId,
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
      console.error('Failed to send notification for review reply', error);
    }

    return updatedReview;
  }
}
