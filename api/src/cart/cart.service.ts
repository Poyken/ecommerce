import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
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
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Lấy giỏ hàng của người dùng.
   * Nếu chưa có giỏ hàng, tự động tạo mới.
   */
  async getCart(userId: string) {
    try {
      // Tìm hoặc tạo giỏ hàng (Truy vấn tối thiểu - Minimal query)
      let cart = await this.prisma.cart.findFirst({
        where: { userId: userId },
      });

      // Kiểm tra user có tồn tại không trước khi tạo cart
      const userExists = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!userExists) {
        throw new NotFoundException('User không tồn tại');
      }

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
        // Chuyển đổi kiểu Decimal an toàn (Safe Decimal casting)
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
      // Logger.error('Lỗi CartService.getCart:', error);
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
        let newQuantity = existingItem.quantity + dto.quantity;
        let capped = false;

        if (sku.stock < newQuantity) {
          newQuantity = sku.stock;
          capped = true;
        }

        const updated = await this.prisma.cartItem.update({
          where: { id: existingItem.id },
          data: { quantity: newQuantity },
        });

        return { ...updated, capped };
      } else {
        // Nếu chưa có -> Tạo mới item trong giỏ
        let quantity = dto.quantity;
        let capped = false;

        if (sku.stock < quantity) {
          quantity = sku.stock;
          capped = true;
        }

        const created = await this.prisma.cartItem.create({
          data: {
            cartId: cart.id,
            skuId: dto.skuId,
            quantity: quantity,
          },
        });

        return { ...created, capped };
      }
    } catch (error: any) {
      // Logger.error('Lỗi addToCart Service:', error);
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
    const results: any[] = [];

    // Xử lý từng item một để đảm bảo validation đầy đủ
    for (const item of items) {
      try {
        const res = await this.addToCart(userId, {
          skuId: item.skuId,
          quantity: item.quantity,
        });
        results.push({ skuId: item.skuId, success: true, data: res });
      } catch (error: any) {
        // Nếu item nào fail (hết hàng, SKU không tồn tại, etc), vẫn tiếp tục merge items còn lại
        results.push({
          skuId: item.skuId,
          success: false,
          error: error.message,
        });
      }
    }

    return results;
  }
}
