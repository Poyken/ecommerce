import { PrismaService } from '@core/prisma/prisma.service';
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
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. PERSISTENT CART:
 * - Giỏ hàng của người dùng đã đăng nhập được lưu trữ trong database (`Prisma`).
 * - Nếu user chưa có giỏ hàng, hệ thống sẽ tự động tạo mới khi truy cập (`getCart`).
 *
 * 2. STOCK VALIDATION:
 * - Luôn kiểm tra tồn kho (`sku.stock`) trước khi thêm hoặc cập nhật số lượng trong giỏ.
 * - Đảm bảo người dùng không thể đặt mua nhiều hơn số lượng thực tế đang có.
 *
 * 3. UPSERT LOGIC:
 * - Khi thêm sản phẩm, nếu sản phẩm đó đã có trong giỏ, ta thực hiện cộng dồn số lượng (`update`) thay vì tạo mới (`create`).
 *
 * 4. CART MERGING:
 * - Hỗ trợ gộp giỏ hàng từ khách (Guest Cart - lưu ở LocalStorage) vào tài khoản khi họ đăng nhập.
 * - Logic gộp được xử lý từng item một để đảm bảo validation tồn kho cho từng sản phẩm.
 * =====================================================================
 */

@Injectable()
export class CartService {
  private readonly logger = new Logger(CartService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * [P14 OPTIMIZATION] Automated Abandoned Cart Cleanup (Daily)
   * Purge carts not updated for more than 30 days.
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async pruneAbandonedCarts(daysOld = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    try {
      const result = await this.prisma.cart.deleteMany({
        where: {
          updatedAt: { lt: cutoffDate },
        },
      });

      if (result.count > 0) {
        this.logger.log(
          `[Prune] Abandoned carts cleanup complete. Removed ${result.count} carts inactive for ${daysOld} days.`,
        );
      }
    } catch (error) {
      this.logger.error('Failed to prune abandoned carts:', error);
    }
  }

  /**
   * Lấy giỏ hàng của người dùng.
   * Nếu chưa có giỏ hàng, tự động tạo mới.
   *
   * ✅ PRODUCTION-SAFE: Uses atomic upsert (no race conditions)
   * ✅ Single query (fetch cart + items together)
   * ✅ No redundant user check (FK constraint handles it)
   */
  async getCart(userId: string) {
    try {
      // Single atomic operation: create cart if not exists + load items
      const cart = await this.prisma.cart.upsert({
        where: { userId },
        update: {}, // No update needed, just fetch
        create: { userId },
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

      // Calculate totals
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
   * ✅ PRODUCTION-SAFE: All validation happens INSIDE transaction
   * ✅ No TOCTOU bugs (Time-of-Check-Time-of-Use)
   * ✅ Atomic operations (prevents race conditions)
   * ✅ No overselling possible
   */
  async addToCart(userId: string, dto: AddToCartDto) {
    return await this.prisma.$transaction(
      async (tx) => {
        // 1. Validate SKU atomically (inside transaction)
        const sku = await tx.sku.findUnique({
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

        // Stock check INSIDE transaction (prevents TOCTOU bug)
        if (sku.stock < dto.quantity) {
          throw new BadRequestException(
            `Không đủ hàng trong kho. Còn lại: ${sku.stock}`,
          );
        }

        // 2. Get or create cart (atomic upsert)
        const cart = await tx.cart.upsert({
          where: { userId },
          update: {},
          create: { userId },
        });

        // 3. Upsert cart item (atomic)
        const cartItem = await tx.cartItem.upsert({
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
          },
        });

        // 4. Verify final quantity doesn't exceed stock
        if (cartItem.quantity > sku.stock) {
          // Cap at maximum available stock
          const capped = await tx.cartItem.update({
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
        isolationLevel: 'Serializable', // Strongest isolation
        timeout: 5000, // 5 second timeout
      },
    );
  }

  /**
   * Cập nhật số lượng item trong giỏ (VD: Tăng/Giảm ở trang giỏ hàng).
   */
  async updateItem(userId: string, itemId: string, dto: UpdateCartItemDto) {
    // Check quyền sở hữu item này (thuộc giỏ của user này)
    const item = await this.prisma.cartItem.findUnique({
      where: { id: itemId },
      include: { cart: true, sku: true },
    });

    if (!item || item.cart.userId !== userId) {
      throw new NotFoundException('Không tìm thấy sản phẩm trong giỏ');
    }

    // Check tồn kho cho số lượng MỚI
    this.logger.debug(
      `[UpdateItem] Checking SKU ${item.sku.skuCode}: stock=${item.sku.stock}, newQty=${dto.quantity}`,
    );
    if (item.sku.stock < dto.quantity) {
      throw new BadRequestException({
        message: `Không đủ hàng trong kho. Còn lại: ${item.sku.stock}`,
        availableStock: item.sku.stock,
      });
    }

    return this.prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity: dto.quantity },
    });
  }

  /**
   * Xóa một item khỏi giỏ hàng.
   */
  async removeItem(userId: string, itemId: string) {
    const item = await this.prisma.cartItem.findUnique({
      where: { id: itemId },
      include: { cart: true },
    });

    if (!item || item.cart.userId !== userId) {
      throw new NotFoundException('Không tìm thấy sản phẩm trong giỏ');
    }

    return this.prisma.cartItem.delete({ where: { id: itemId } });
  }

  /**
   * Xóa toàn bộ giỏ hàng (Clear Cart).
   */
  async clearCart(userId: string) {
    const cart = await this.prisma.cart.findUnique({ where: { userId } });
    if (!cart) return;

    return this.prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  }

  /**
   * Gộp giỏ hàng guest vào cart của user trong database
   * Được gọi khi user login - merge items từ localStorage vào DB
   *
   * Chiến lược:
   * - Loop qua từng item và dùng addToCart để xử lý
   * - addToCart tự động check tồn kho và cộng dồn nếu item đã tồn tại
   * - Trả về kết quả cho từng item (success/fail)
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

        // 1. Get or create cart once
        const cart = await tx.cart.upsert({
          where: { userId },
          update: {},
          create: { userId },
        });

        // 2. Fetch all SKUs in one go for validation
        const skuIds = items.map((i) => i.skuId);
        const skus = await tx.sku.findMany({
          where: { id: { in: skuIds } },
          select: {
            id: true,
            skuCode: true,
            stock: true,
            status: true,
          },
        });

        const skuMap = new Map(skus.map((s) => [s.id, s]));

        // 3. Process items
        for (const item of items) {
          try {
            const sku = skuMap.get(item.skuId);
            if (!sku) throw new Error('Sản phẩm (SKU) không tồn tại');
            if (sku.status !== 'ACTIVE')
              throw new Error('Sản phẩm không còn được bán');

            // Atomic upsert for each item within the same transaction
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
              },
            });

            // Stock check validation
            if (cartItem.quantity > sku.stock) {
              const capped = await tx.cartItem.update({
                where: { id: cartItem.id },
                data: { quantity: sku.stock },
              });
              results.push({
                skuId: item.skuId,
                success: true,
                data: capped,
                capped: true,
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
