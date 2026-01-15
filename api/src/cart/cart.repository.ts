import { Injectable, NotFoundException } from '@nestjs/common';
import { BaseRepository } from '@core/repository/base.repository';
import { PrismaService } from '@core/prisma/prisma.service';
import { Cart, CartItem, Prisma } from '@prisma/client';

/**
 * =====================================================================
 * CART REPOSITORY - TRUY CẬP DỮ LIỆU GIỎ HÀNG
 * =====================================================================
 */

export type CartWithItems = Prisma.CartGetPayload<{
  include: {
    items: {
      include: {
        sku: {
          include: {
            product: {
              include: { images: { take: 1 } };
            };
          };
        };
      };
    };
  };
}>;

@Injectable()
export class CartRepository extends BaseRepository<Cart> {
  protected readonly modelName = 'cart';

  constructor(prisma: PrismaService) {
    super(prisma);
  }

  private get itemIncludes() {
    return {
      sku: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              images: { take: 1, select: { url: true, alt: true } },
            },
          },
          optionValues: {
            include: {
              optionValue: {
                select: { value: true, option: { select: { name: true } } },
              },
            },
          },
        },
      },
    };
  }

  /**
   * Lấy cart của user với items
   */
  async findByUser(userId: string): Promise<CartWithItems | null> {
    return await this.model.findFirst({
      where: this.withTenantFilter({ userId }),
      include: {
        items: {
          include: this.itemIncludes,
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  /**
   * Lấy hoặc tạo cart cho user
   */
  async findOrCreate(userId: string): Promise<CartWithItems> {
    let cart = await this.findByUser(userId);

    if (!cart) {
      cart = await this.model.create({
        data: {
          userId,
          tenantId: this.tenantId!,
        },
        include: {
          items: {
            include: this.itemIncludes,
          },
        },
      });
    }

    return cart!;
  }

  /**
   * Thêm item vào cart
   */
  async addItem(
    userId: string,
    skuId: string,
    quantity: number,
  ): Promise<CartWithItems> {
    const cart = await this.findOrCreate(userId);

    // Check if item already exists
    const existingItem = cart.items.find((item: any) => item.skuId === skuId);

    if (existingItem) {
      await this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + quantity },
      });
    } else {
      await this.prisma.cartItem.create({
        data: {
          cartId: cart.id,
          skuId,
          quantity,
          tenantId: this.tenantId!,
        },
      });
    }

    return this.findByUser(userId) as Promise<CartWithItems>;
  }

  /**
   * Cập nhật số lượng item
   */
  async updateItemQuantity(
    userId: string,
    itemId: string,
    quantity: number,
  ): Promise<CartWithItems> {
    const cart = await this.findByUser(userId);
    if (!cart) throw new NotFoundException('Cart not found');

    const item = cart.items.find((i: any) => i.id === itemId);
    if (!item) throw new NotFoundException('Item not found in cart');

    if (quantity <= 0) {
      await this.prisma.cartItem.delete({ where: { id: itemId } });
    } else {
      await this.prisma.cartItem.update({
        where: { id: itemId },
        data: { quantity },
      });
    }

    return this.findByUser(userId) as Promise<CartWithItems>;
  }

  /**
   * Xóa item khỏi cart
   */
  async removeItem(userId: string, itemId: string): Promise<CartWithItems> {
    return this.updateItemQuantity(userId, itemId, 0);
  }

  /**
   * Xóa toàn bộ cart
   */
  async clear(userId: string): Promise<void> {
    const cart = await this.findByUser(userId);
    if (cart) {
      await this.prisma.cartItem.deleteMany({
        where: { cartId: cart.id },
      });
    }
  }

  /**
   * Tính tổng giá trị cart
   */
  async calculateTotal(userId: string): Promise<{
    subtotal: number;
    itemCount: number;
  }> {
    const cart = await this.findByUser(userId);
    if (!cart) return { subtotal: 0, itemCount: 0 };

    let subtotal = 0;
    let itemCount = 0;

    for (const item of cart.items) {
      const price = item.sku.salePrice || item.sku.price;
      subtotal += Number(price) * item.quantity;
      itemCount += item.quantity;
    }

    return { subtotal, itemCount };
  }
}
