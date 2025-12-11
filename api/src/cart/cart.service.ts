import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

@Injectable()
export class CartService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Lấy giỏ hàng của người dùng.
   * Nếu chưa có giỏ hàng, tự động tạo mới.
   */
  async getCart(userId: string) {
    try {
      // Tìm hoặc tạo giỏ hàng (minimal query)
      let cart = await this.prisma.cart.findFirst({
        where: { userId: userId },
      });

      if (!cart) {
        cart = await this.prisma.cart.create({
          data: {
            userId: userId,
          },
        });
      }

      // Lấy items riêng
      const items = await this.prisma.cartItem.findMany({
        where: { cartId: cart.id },
        include: {
          sku: {
            include: {
              product: true,
              optionValues: {
                include: {
                  optionValue: {
                    include: {
                      option: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      // Tính tổng tiền
      let totalAmount = 0;
      let totalItems = 0;

      for (const item of items) {
        // Safe Decimal casting
        const p = item.sku?.salePrice ?? item.sku?.price ?? 0;
        const price = Number(p);
        totalAmount += price * item.quantity;
        totalItems += item.quantity;
      }

      return {
        ...cart,
        items,
        totalAmount,
        totalItems,
      };
    } catch (error) {
      console.error('CartService.getCart error:', error);
      throw error;
    }
  }

  /**
   * Thêm sản phẩm (SKU) vào giỏ hàng.
   */
  async addToCart(userId: string, dto: AddToCartDto) {
    try {
      // 1. Validate SKU có tồn tại và còn hàng không
      const sku = await this.prisma.sku.findUnique({
        where: { id: dto.skuId },
      });
      if (!sku) throw new NotFoundException('Sản phẩm (SKU) không tồn tại');

      // Kiểm tra tồn kho
      if (sku.stock < dto.quantity) {
        throw new BadRequestException(
          `Không đủ hàng trong kho. Còn lại: ${sku.stock}`,
        );
      }

      // 2. Lấy hoặc tạo Giỏ hàng
      let cart = await this.prisma.cart.findUnique({ where: { userId } });
      if (!cart) {
        cart = await this.prisma.cart.create({ data: { userId } });
      }

      // 3. Upsert (Update hoặc Insert) Cart Item
      // Kiểm tra xem SKU này đã có trong giỏ chưa
      const existingItem = await this.prisma.cartItem.findUnique({
        where: {
          cartId_skuId: {
            cartId: cart.id,
            skuId: dto.skuId,
          },
        },
      });

      if (existingItem) {
        // Nếu đã có -> Cộng dồn số lượng
        const newQuantity = existingItem.quantity + dto.quantity;
        if (sku.stock < newQuantity) {
          throw new BadRequestException(
            `Tổng số lượng vượt quá tồn kho. Còn lại: ${sku.stock}`,
          );
        }
        return await this.prisma.cartItem.update({
          where: { id: existingItem.id },
          data: { quantity: newQuantity },
        });
      } else {
        // Nếu chưa có -> Tạo mới item trong giỏ
        return await this.prisma.cartItem.create({
          data: {
            cartId: cart.id,
            skuId: dto.skuId,
            quantity: dto.quantity,
          },
        });
      }
    } catch (error: any) {
      console.error('addToCart Service Error:', error);
      throw new BadRequestException(error.message || 'Error processing cart');
    }
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
    if (item.sku.stock < dto.quantity) {
      throw new BadRequestException(
        `Không đủ hàng trong kho. Còn lại item.sku.stock`,
      );
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
}
