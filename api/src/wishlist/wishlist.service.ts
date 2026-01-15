import { PrismaService } from '@core/prisma/prisma.service';
import { Injectable, Logger } from '@nestjs/common';
import { getTenant } from '@core/tenant/tenant.context';

/**
 * =====================================================================
 * WISHLIST SERVICE - QUẢN LÝ DANH SÁCH YÊU THÍCH
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. TOGGLE LOGIC:
 * - Hàm `toggle` kết hợp cả Thêm và Xóa.
 * - Nếu sản phẩm đã có trong wishlist -> Xóa đi.
 * - Nếu chưa có -> Tạo mới.
 * - Đây là pattern phổ biến cho các nút "Like" hoặc "Tim" trên UI.
 *
 * 2. COMPOSITE KEY:
 * - Trong DB, `userId` và `productId` tạo thành một Unique Constraint.
 * - Điều này ngăn chặn việc một User thêm trùng 1 sản phẩm vào Wishlist nhiều lần. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Tiếp nhận request từ Client, điều phối xử lý và trả về response.

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
   * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
   *
   * 1. TOGGLE LOGIC:
   * - Thay vì viết 2 hàm `add` và `remove`, ta dùng 1 hàm `toggle` duy nhất.
   * - Check tồn tại -> Nếu có thì xóa (Return false), chưa có thì thêm (Return true).
   * - Giảm bớt logic xử lý ở Frontend (chỉ cần gọi 1 API khi bấm tim).
   *
   * 2. COMPOSITE KEY (Khóa tổ hợp):
   * - Bảng Wishlist dùng khóa chính là cặp `[userId, productId]`.
   * - Đảm bảo mỗi user chỉ thích 1 sản phẩm 1 lần duy nhất (DB Constraint).
   *
   * 3. EAGER LOADING (Tải sớm):
   * - Khi lấy danh sách wishlist, ta `include` luôn Product + Image đại diện.
   * - Tránh lỗi N+1 Query (Query wishlist xong lại phải loop query từng product).
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
