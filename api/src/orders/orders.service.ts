import { InjectQueue } from '@nestjs/bullmq';
import {
    BadRequestException,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { Queue } from 'bullmq';
import { PaymentService } from 'src/payment/payment.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentService: PaymentService,
    @InjectQueue('email-queue') private readonly emailQueue: Queue,
  ) {}

  // ... (create method start) ...

  async create(userId: string, createOrderDto: CreateOrderDto) {
    // 0. Lấy thông tin User để gửi mail
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('User không tồn tại');

    // 1. Lấy giỏ hàng của user
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: {
        items: {
          include: { sku: true },
        },
      },
    });

    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('Giỏ hàng trống');
    }

    // 2. Chuẩn bị dữ liệu sơ bộ
    let totalAmount = 0;
    const orderItemsData: {
      skuId: string;
      quantity: number;
      priceAtPurchase: number;
    }[] = [];

    for (const item of cart.items) {
      // Check nhanh (Fail-fast) - Không thay thế atomic check
      if (item.sku.stock < item.quantity) {
        throw new BadRequestException(
          `Sản phẩm ${item.sku.skuCode} không đủ số lượng (Yêu cầu: ${item.quantity}, Còn: ${item.sku.stock}).`,
        );
      }

      const price = Number(item.sku.price);
      totalAmount += price * item.quantity;

      orderItemsData.push({
        skuId: item.skuId,
        quantity: item.quantity,
        priceAtPurchase: price,
      });
    }

    // 3. Thực thi Transaction (Atomic)
    const order = await this.prisma.$transaction(async (tx) => {
      // ... (Transaction logic unchanged) ...
      // A. Tạo Order (Trạng thái PENDING)
      const newOrder = await tx.order.create({
        data: {
          userId,
          totalAmount: totalAmount,
          recipientName: createOrderDto.recipientName,
          phoneNumber: createOrderDto.phoneNumber,
          shippingAddress: createOrderDto.shippingAddress,
          paymentMethod: createOrderDto.paymentMethod || 'COD',
          status: OrderStatus.PENDING,
          items: {
            create: orderItemsData,
          },
        },
        include: { items: true },
      });

      // B. Trừ tồn kho
      for (const item of cart.items) {
        const result = await tx.sku.updateMany({
          where: {
            id: item.skuId,
            stock: { gte: item.quantity },
          },
          data: {
            stock: { decrement: item.quantity },
          },
        });

        if (result.count === 0) {
          throw new BadRequestException(
            `Giao dịch thất bại! Sản phẩm ${item.sku.skuCode} vừa bị người khác mua hết.`,
          );
        }
      }

      // C. Xóa giỏ hàng
      await tx.cartItem.deleteMany({
        where: { cartId: cart.id },
      });

      return newOrder;
    });

    // 4. Xử lý Thanh toán
    // ... (Payment logic unchanged) ...

    try {
      if (createOrderDto.paymentMethod) {
        // ... payment processing ...
        const paymentResult = await this.paymentService.processPayment(
          createOrderDto.paymentMethod,
          {
            amount: Number(order.totalAmount),
            orderId: order.id,
          },
        );

        if (paymentResult.success) {
          await this.prisma.order.update({
            where: { id: order.id },
            data: {
              paymentStatus: 'PAID',
              transactionId: paymentResult.transactionId,
            },
          });
          order.paymentStatus = 'PAID' as any;
        }
      }
    } catch (error) {
      console.error(`Payment failed for order ${order.id}`, error);
    }

    // 5. Gửi Email xác nhận (Background Job)
    try {
      await this.emailQueue.add('send-confirmation', {
        orderId: order.id,
        email: user.email,
        totalAmount: order.totalAmount,
      });
      console.log(
        `[OrderService] Đã thêm job gửi email cho Đơn hàng #${order.id}`,
      );
    } catch (error) {
      console.error(`Thêm job gửi email thất bại`, error);
    }

    return order;
  }

  /**
   * Xem lịch sử đơn hàng của User.
   */
  async findAllByUser(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: {
            sku: {
              include: { product: true },
            },
          },
        },
      },
    });
  }

  async findOne(id: string, userId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            sku: {
              include: {
                product: true,
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
        },
      },
    });

    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');

    // Check quyền sở hữu (Security)
    if (order.userId !== userId) {
      // Có thể throw ForbiddenException
    }

    return order;
  }

  // Dành cho Admin: Xem tất cả đơn
  async findAll(search?: string) {
    const where: any = {};
    if (search) {
      where.OR = [
        { id: { contains: search, mode: 'insensitive' } },
        { recipientName: { contains: search, mode: 'insensitive' } },
        { phoneNumber: { contains: search, mode: 'insensitive' } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    return this.prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { email: true } } },
    });
  }

  // Dành cho Admin: Xem chi tiết bất kỳ
  async findOneAdmin(id: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            sku: {
              include: { product: true },
            },
          },
        },
        user: true,
      },
    });
    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');
    return order;
  }

  /**
   * Cập nhật trạng thái đơn hàng (Admin).
   * PENDING -> CONFIRMED -> SHIPPED -> DELIVERED
   */
  async updateStatus(id: string, dto: UpdateOrderStatusDto) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Order not found');

    const currentStatus = order.status;
    const newStatus = dto.status;

    // Rules
    // 1. PENDING -> CONFIRMED, CANCELLED
    // 2. CONFIRMED -> SHIPPED, CANCELLED
    // 3. SHIPPED -> DELIVERED
    // 4. DELIVERED -> (None)
    // 5. CANCELLED -> (None)

    let isValid = false;

    switch (currentStatus) {
      case OrderStatus.PENDING:
        if (
          newStatus === OrderStatus.PROCESSING ||
          newStatus === OrderStatus.CANCELLED
        ) {
          isValid = true;
        }
        break;
      case OrderStatus.PROCESSING:
        if (
          newStatus === OrderStatus.SHIPPED ||
          newStatus === OrderStatus.CANCELLED
        ) {
          isValid = true;
        }
        break;
      case OrderStatus.SHIPPED:
        if (newStatus === OrderStatus.DELIVERED) {
          isValid = true;
        }
        break;
      case OrderStatus.DELIVERED:
      case OrderStatus.CANCELLED:
        isValid = false; // Cannot change
        break;
      default:
        isValid = false;
    }

    if (!isValid) {
      throw new BadRequestException(
        `Cannot change status from ${currentStatus} to ${newStatus}`,
      );
    }

    return this.prisma.order.update({
      where: { id },
      data: { status: dto.status as OrderStatus },
    });
  }
}
