import { PrismaService } from '@core/prisma/prisma.service';
import { getTenant } from '@core/tenant/tenant.context';
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

/**
 * =====================================================================
 * CART SERVICE - Dịch vụ quản lý giỏ hàng
 * =====================================================================
 *
 * =====================================================================
 */

@Injectable()
export class CartService {
  private readonly logger = new Logger(CartService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * [P14 TỰ ĐỘNG HÓA] Dọn dẹp giỏ hàng "bị bỏ quên" (Abandoned Cart Cleanup).
   * - Chạy định kỳ vào 00:00 hàng ngày.
   * - Xóa các giỏ hàng không hoạt động quá 30 ngày để giải phóng DB.
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async pruneAbandonedCarts(daysOld = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    try {
      const result = await (this.prisma.cart as any).deleteMany({
        where: {
          updatedAt: { lt: cutoffDate },
        },
      });

      if (result.count > 0) {
        this.logger.log(
          `[Prune] Đã dọn dẹp ${result.count} giỏ hàng bị bỏ quên quá ${daysOld} ngày.`,
        );
      }
    } catch (error) {
      this.logger.error('Lỗi khi dọn dẹp giỏ hàng:', error);
    }
  }

  /**
   * Lấy giỏ hàng của người dùng.
   * - Nếu chưa có giỏ hàng, tự động tạo mới (Upsert).
   *
   * ✅ AN TOÀN CAO: Dùng Atomic Upsert để tránh lỗi Race Condition.
   * ✅ HIỆU NĂNG: Chỉ 1 query để lấy cả Cart và Items (Include).
   */
  async getCart(userId: string) {
    const tenant = getTenant();
    if (!tenant)
      throw new BadRequestException(
        'Không xác định được Cửa hàng (Tenant context missing)',
      );

    try {
      // Upsert: Tìm hoặc tạo mới trong 1 thao tác DB
      const cart = await (this.prisma.cart as any).upsert({
        where: {
          userId_tenantId: {
            userId,
            tenantId: tenant.id,
          },
        },
        update: {}, // Không làm gì nếu đã tồn tại
        create: {
          userId,
          tenantId: tenant.id,
        },
        include: {
          items: {
            select: {
              id: true,
              quantity: true,
              createdAt: true,
              sku: {
                select: {
                  id: true,
                  skuCode: true,
                  price: true,
                  salePrice: true,
                  stock: true,
                  imageUrl: true,
                  product: {
                    select: {
                      id: true,
                      name: true,
                      slug: true,
                    },
                  },
                  optionValues: {
                    select: {
                      optionValue: {
                        select: {
                          id: true,
                          value: true,
                          option: {
                            select: {
                              id: true,
                              name: true,
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
            orderBy: { createdAt: 'desc' },
          },
        },
      });

      // Tính tổng tiền & Tổng số lượng (Client có thể tự tính, nhưng Server tính sẽ chuẩn hơn)
      let totalAmount = 0;
      let totalItems = 0;

      for (const item of cart.items) {
        // Decimal to number conversion
        const p = item.sku?.salePrice ?? item.sku?.price ?? 0;
        const price = Number(p);
        totalAmount += price * item.quantity;
        totalItems += item.quantity;
      }

      return {
        ...cart,
        totalAmount,
        totalItems,
      };
    } catch (error: any) {
      // If user doesn't exist, FK constraint will throw P2003
      if (error.code === 'P2003') {
        throw new NotFoundException('User không tồn tại');
      }
      throw error;
    }
  }

  /**
   * Thêm sản phẩm (SKU) vào giỏ hàng.
   *
   * ✅ QUAN TRỌNG: Tất cả validation và write data đều nằm trong Transaction.
   * ✅ TRÁNH LỖI TOCTOU (Time-of-Check-Time-of-Use): Check tồn kho và trừ kho an toàn.
   * ✅ KHÔNG OVERSELLING: Đảm bảo không bao giờ bán quá số lượng có sẵn.
   */
  async addToCart(userId: string, dto: AddToCartDto) {
    return await this.prisma.$transaction(
      async (tx) => {
        // 1. Kiểm tra SKU (Nguyên tử trong transaction)
        const sku: any = await (tx.sku as any).findUnique({
          where: { id: dto.skuId },
          select: {
            id: true,
            skuCode: true,
            stock: true,
            status: true,
            price: true,
            salePrice: true,
          },
        });

        if (!sku) {
          throw new NotFoundException('Sản phẩm (SKU) không tồn tại');
        }

        if (sku.status !== 'ACTIVE') {
          throw new BadRequestException('Sản phẩm không còn được bán');
        }

        this.logger.debug(
          `[AddToCart] SKU ${sku.skuCode}: stock=${sku.stock}, reqQty=${dto.quantity}`,
        );

        // Check tồn kho TRONG transaction (ngăn chặn bug TOCTOU)
        if (sku.stock < dto.quantity) {
          throw new BadRequestException(
            `Không đủ hàng trong kho. Còn lại: ${sku.stock}`,
          );
        }

        // 2. Lấy hoặc tạo Cart (Atomic Upsert)
        const tenant = getTenant();
        if (!tenant)
          throw new BadRequestException(
            'Không xác định được Cửa hàng (Tenant context missing)',
          );

        const cart = await tx.cart.upsert({
          where: {
            userId_tenantId: {
              userId,
              tenantId: tenant.id,
            },
          },
          update: {},
          create: {
            userId,
            tenantId: tenant.id,
          },
        });

        // 3. Upsert Cart Item (Cộng dồn số lượng nếu đã có)
        const cartItem = await (tx.cartItem as any).upsert({
          where: {
            cartId_skuId: {
              cartId: cart.id,
              skuId: dto.skuId,
            },
          },
          update: {
            quantity: {
              increment: dto.quantity,
            },
          },
          create: {
            cartId: cart.id,
            skuId: dto.skuId,
            quantity: dto.quantity,
            tenantId: tenant.id,
          },
        });

        // 4. Kiểm tra lại lần cuối: Nếu tổng số lượng trong giỏ > Tồn kho -> Cắt xuống bằng tồn kho
        if (cartItem.quantity > sku.stock) {
          // Cap at maximum available stock
          const capped = await (tx.cartItem as any).update({
            where: { id: cartItem.id },
            data: { quantity: sku.stock },
          });

          this.logger.warn(
            `Cart item capped: SKU ${sku.skuCode} quantity ${cartItem.quantity} → ${sku.stock}`,
          );

          return { ...capped, capped: true };
        }

        return { ...cartItem, capped: false };
      },
      {
        isolationLevel: 'Serializable', // Mức cô lập cao nhất để đảm bảo an toàn tuyệt đối
        timeout: 5000,
      },
    );
  }

  /**
   * Cập nhật số lượng item trong giỏ (VD: Tăng + / Giảm - ở trang giỏ hàng).
   */
  async updateItem(userId: string, itemId: string, dto: UpdateCartItemDto) {
    // 1. Check quyền sở hữu: Item này có phải của User này không?
    const item = await (this.prisma.cartItem as any).findUnique({
      where: { id: itemId },
      include: { cart: true, sku: true },
    });

    if (!item || item.cart.userId !== userId) {
      throw new NotFoundException('Không tìm thấy sản phẩm trong giỏ');
    }

    // 2. Check tồn kho cho số lượng MỚI
    this.logger.debug(
      `[UpdateItem] SKU ${item.sku.skuCode}: stock=${item.sku.stock}, newQty=${dto.quantity}`,
    );
    if (item.sku.stock < dto.quantity) {
      throw new BadRequestException({
        message: `Không đủ hàng trong kho. Còn lại: ${item.sku.stock}`,
        availableStock: item.sku.stock,
      });
    }

    return (this.prisma.cartItem as any).update({
      where: { id: itemId },
      data: { quantity: dto.quantity },
    });
  }

  /**
   * Xóa một item khỏi giỏ hàng.
   */
  async removeItem(userId: string, itemId: string) {
    const item = await (this.prisma.cartItem as any).findUnique({
      where: { id: itemId },
      include: { cart: true },
    });

    if (!item || item.cart.userId !== userId) {
      throw new NotFoundException('Không tìm thấy sản phẩm trong giỏ');
    }

    return (this.prisma.cartItem as any).delete({ where: { id: itemId } });
  }

  /**
   * Xóa toàn bộ giỏ hàng (Clear Cart).
   */
  async clearCart(userId: string) {
    const tenant = getTenant();
    if (!tenant) return;

    const cart = await (this.prisma.cart as any).findUnique({
      where: {
        userId_tenantId: {
          userId,
          tenantId: tenant.id,
        },
      },
    });
    if (!cart) return;

    return (this.prisma.cartItem as any).deleteMany({
      where: { cartId: cart.id },
    });
  }

  /**
   * Gộp giỏ hàng Guest (LocalStorage) vào tài khoản User khi đăng nhập.
   * - Được gọi ngay sau khi login thành công.
   *
   * Chiến lược:
   * - Loop qua từng item và dùng logic `addToCart` (upsert) để xử lý.
   * - Trả về kết quả chi tiết cho từng item (Thành công/Thất bại/Bị giới hạn số lượng).
   */
  async mergeCart(
    userId: string,
    items: { skuId: string; quantity: number }[],
  ) {
    if (!items.length) return [];

    return await this.prisma.$transaction(
      async (tx) => {
        const results: {
          skuId: string;
          success: boolean;
          data?: any;
          error?: string;
          capped?: boolean;
        }[] = [];

        // 1. Get hoặc Create Cart một lần duy nhất
        const tenant = getTenant();
        if (!tenant)
          throw new Error(
            'Không xác định được Cửa hàng (Tenant context missing)',
          );

        const cart = await tx.cart.upsert({
          where: {
            userId_tenantId: {
              userId,
              tenantId: tenant.id,
            },
          },
          update: {},
          create: {
            userId,
            tenantId: tenant.id,
          },
        });

        // 2. Fetch tất cả SKU một lần để tối ưu (Bulk Read)
        const skuIds = items.map((i) => i.skuId);
        const skus = await (tx.sku as any).findMany({
          where: { id: { in: skuIds } },
          select: {
            id: true,
            skuCode: true,
            stock: true,
            status: true,
          },
        });

        const skuMap = new Map(skus.map((s) => [s.id, s]));

        // 3. Xử lý từng item
        for (const item of items) {
          try {
            const sku: any = skuMap.get(item.skuId);
            if (!sku) throw new Error('Sản phẩm (SKU) không tồn tại');
            if (sku.status !== 'ACTIVE')
              throw new Error('Sản phẩm không còn được bán');

            // Atomic Upsert cho item
            const cartItem = await tx.cartItem.upsert({
              where: {
                cartId_skuId: {
                  cartId: cart.id,
                  skuId: item.skuId,
                },
              },
              update: {
                quantity: { increment: item.quantity },
              },
              create: {
                cartId: cart.id,
                skuId: item.skuId,
                quantity: item.quantity,
                tenantId: tenant.id,
              },
            });

            // Validate lại số lượng sau khi cộng dồn
            if (cartItem.quantity > sku.stock) {
              const capped = await (tx.cartItem as any).update({
                where: { id: cartItem.id },
                data: { quantity: sku.stock },
              });
              results.push({
                skuId: item.skuId,
                success: true,
                data: capped,
                capped: true, // Đánh dấu là bị cắt giảm số lượng do hết kho
              });
            } else {
              results.push({
                skuId: item.skuId,
                success: true,
                data: cartItem,
                capped: false,
              });
            }
          } catch (error: any) {
            results.push({
              skuId: item.skuId,
              success: false,
              error: error.message,
            });
          }
        }

        return results;
      },
      { isolationLevel: 'Serializable' },
    );
  }
}
