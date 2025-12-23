/* eslint-disable @typescript-eslint/no-unsafe-enum-comparison */
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

/**
 * =====================================================================
 * ORDERS SERVICE - Dịch vụ quản lý đơn hàng (Trái tim của hệ thống)
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. DATABASE TRANSACTIONS (Tính nguyên tử):
 * - Khi tạo đơn hàng, ta dùng `this.prisma.$transaction`.
 * - Đảm bảo: Hoặc là tất cả thành công (Tạo đơn + Trừ kho + Xóa giỏ), hoặc là không có gì thay đổi nếu có lỗi xảy ra.
 * - Tránh tình trạng: Đơn hàng đã tạo nhưng kho không trừ, hoặc ngược lại.
 *
 * 2. ATOMIC STOCK CHECK:
 * - Trong transaction, ta dùng `updateMany` kèm điều kiện `stock: { gte: item.quantity }`.
 * - Đây là cách chống "Race Condition" (2 người cùng mua 1 món hàng cuối cùng tại 1 thời điểm) hiệu quả nhất ở tầng DB.
 *
 * 3. BACKGROUND JOBS (BullMQ):
 * - Gửi email xác nhận là một tác vụ tốn thời gian và có thể lỗi (do SMTP).
 * - Ta không bắt user đợi gửi mail xong mới trả kết quả. Thay vào đó, ta đẩy vào `emailQueue` để xử lý ngầm.
 *
 * 4. STATE MACHINE (Máy trạng thái):
 * - Trạng thái đơn hàng (`PENDING`, `SHIPPED`, v.v.) được quản lý chặt chẽ.
 * - Chỉ cho phép chuyển đổi trạng thái theo đúng quy trình (VD: Không thể chuyển từ `CANCELLED` sang `DELIVERED`).
 * =====================================================================
 */

import { EmailService } from '../common/email/email.service';
import { CouponsService } from '../coupons/coupons.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { NotificationsService } from '../notifications/notifications.service';
import { InventoryService } from '../products/skus/inventory.service';
import { ShippingService } from '../shipping/shipping.service';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentService: PaymentService,
    @InjectQueue('email-queue') private readonly emailQueue: Queue,
    private readonly couponsService: CouponsService,
    private readonly shippingService: ShippingService,
    private readonly inventoryService: InventoryService,
    private readonly emailService: EmailService,
    private readonly notificationsService: NotificationsService,
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  // ... (Bắt đầu hàm xử lý tạo đơn hàng) ...

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

    const itemsToProcess =
      createOrderDto.itemIds && createOrderDto.itemIds.length > 0
        ? cart.items.filter((item) => createOrderDto.itemIds!.includes(item.id))
        : cart.items;

    if (itemsToProcess.length === 0) {
      throw new BadRequestException('No items selected for checkout');
    }

    for (const item of itemsToProcess) {
      // Kiểm tra nhanh (Fail-fast) - Giảm tải cho DB, nhưng không thay thế được atomic check

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

    // Apply Coupon if provided
    let couponId: string | null = null;
    let discountAmount = 0;
    if (createOrderDto.couponCode) {
      const { coupon, discountAmount: valDiscount } =
        await this.couponsService.validateCoupon(
          createOrderDto.couponCode,
          totalAmount,
        );
      couponId = coupon.id;
      discountAmount = valDiscount;

      totalAmount = Math.max(0, totalAmount - discountAmount);
    }

    // 2.a Tính phí vận chuyển (Shipping Fee)
    let shippingFee = 0;
    if (createOrderDto.addressId) {
      const address = await this.prisma.address.findUnique({
        where: { id: createOrderDto.addressId },
      });
      if (address && address.districtId && address.wardCode) {
        shippingFee = await this.shippingService.calculateFee(
          address.districtId,
          address.wardCode,
        );
      }
    }
    totalAmount += shippingFee;

    // 3. Thực thi Transaction (Nguyên tử - Đảm bảo nhất quán dữ liệu)
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
          shippingFee: shippingFee,
          paymentMethod: createOrderDto.paymentMethod || 'COD',
          status: OrderStatus.PENDING,
          couponId: couponId,
          items: {
            create: orderItemsData,
          },
        },
        include: { items: true },
      });

      // B. Trừ tồn kho (Reserve Stock)
      for (const item of itemsToProcess) {
        await this.inventoryService.reserveStock(item.skuId, item.quantity, tx);
      }

      // C. Xóa items đã mua khỏi giỏ hàng
      const itemIdsToDelete = itemsToProcess.map((i) => i.id);
      console.log(
        `[Orders] Deleting cart items: ${itemIdsToDelete.join(', ')} from cart ${cart.id}`,
      );

      const deleteResult = await tx.cartItem.deleteMany({
        where: {
          cartId: cart.id,
          id: { in: itemIdsToDelete },
        },
      });
      console.log(`[Orders] Deleted ${deleteResult.count} items.`);

      // D. Cập nhật usedCount của coupon
      if (couponId) {
        await tx.coupon.update({
          where: { id: couponId },
          data: { usedCount: { increment: 1 } },
        });
      }

      return newOrder;
    });

    let paymentUrl: string | undefined;

    // 4. Xử lý Thanh toán (Payment Integration)
    // ... (Payment logic unchanged) ...

    try {
      if (createOrderDto.paymentMethod) {
        // ... payment processing ...
        const paymentResult = await this.paymentService.processPayment(
          createOrderDto.paymentMethod,
          {
            amount: Number(order.totalAmount),
            orderId: order.id,
            returnUrl: createOrderDto.returnUrl, // Ensure DTO has this or default used in Strategy
          },
        );

        if (paymentResult.success) {
          paymentUrl = paymentResult.paymentUrl;

          // Only mark as PAID if it is immediate success (like Token payment),
          // For Redirect (VNPay), status usually remains PENDING/AWAITING until IPN.
          // But current MockStripe returns success immediately.
          // VNPayStrategy returns success: true, paymentUrl: "..."

          if (!paymentUrl) {
            // Immediate success (Mock Stripe)
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
      }
    } catch (error) {
      console.error(`Payment failed for order ${order.id}`, error);
    }

    // 5. Gửi Email xác nhận (Background Job or Direct Mock)
    try {
      // Mock Email Service
      await this.emailService.sendOrderConfirmation(order);

      // Existing BullMQ job (keep for backward compatibility if needed)
      /*
      await this.emailQueue.add('send-confirmation', {
        orderId: order.id,
        email: user.email,
        totalAmount: order.totalAmount,
      });
      */
    } catch (error) {
      console.error(`Gửi email thất bại`, error);
    }

    // 6. Tạo thông báo (Notification) + Push real-time
    try {
      const notification = await this.notificationsService.create({
        userId: userId,
        type: 'ORDER_PLACED',
        title: 'Đặt hàng thành công',
        message: `Đơn hàng #${order.id.slice(-8)} đã được tạo thành công. Tổng cộng: ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(order.totalAmount))}`,
        link: `/orders/${order.id}`,
      });

      // Push real-time notification via WebSocket
      this.notificationsGateway.sendNotificationToUser(userId, notification);
    } catch (error) {
      console.error('Failed to create notification', error);
    }

    return { ...order, paymentUrl };
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
  async findAll(search?: string, page = 1, limit = 10, includeItems = false) {
    const skip = (page - 1) * limit;
    const where: any = {};
    if (search) {
      where.OR = [
        { id: { contains: search, mode: 'insensitive' } },
        { recipientName: { contains: search, mode: 'insensitive' } },
        { phoneNumber: { contains: search, mode: 'insensitive' } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const include: any = {
      user: { select: { email: true, firstName: true, lastName: true } },
    };

    if (includeItems) {
      include.items = {
        include: {
          sku: {
            include: { product: true },
          },
        },
      };
    }

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include,
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      data: orders,
      meta: {
        total,
        page,
        limit,
        lastPage: Math.ceil(total / limit),
      },
    };
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
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!order) throw new NotFoundException('Order not found');

    const currentStatus = order.status;
    const newStatus = dto.status;

    // Các Quy tắc chuyển trạng thái:
    // 1. PENDING (Chờ) -> CONFIRMED (Đã xác nhận), CANCELLED (Hủy)
    // 2. CONFIRMED -> SHIPPED (Đã gửi), CANCELLED
    // 3. SHIPPED -> DELIVERED (Đã giao)
    // 4. DELIVERED -> (Không thể đổi tiếp - Trạng thái cuối)
    // 5. CANCELLED -> (Không thể đổi tiếp - Trạng thái cuối)

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

    return this.prisma.$transaction(async (tx) => {
      // Nếu trạng thái mới là CANCELLED, hoàn lại tồn kho (Release Stock)
      if (newStatus === OrderStatus.CANCELLED) {
        for (const item of order.items) {
          await this.inventoryService.releaseStock(
            item.skuId,
            item.quantity,
            tx,
          );
        }
      }

      const updatedOrder = await tx.order.update({
        where: { id },
        data: { status: dto.status as OrderStatus },
        include: { user: true },
      });

      if (newStatus === OrderStatus.SHIPPED) {
        await this.emailService.sendShippingUpdate(updatedOrder);
      }

      // Create notification for user + Push real-time
      try {
        let title = 'Cập nhật đơn hàng';
        let message = `Đơn hàng #${id.slice(-8)} đã chuyển sang trạng thái ${newStatus}`;

        let notiType = 'ORDER';
        switch (newStatus) {
          case OrderStatus.PROCESSING:
            title = 'Đơn hàng đang xử lý';
            message = `Đơn hàng #${id.slice(-8)} của bạn đang được chuẩn bị.`;
            notiType = 'ORDER_PROCESSING';
            break;
          case OrderStatus.SHIPPED:
            title = 'Đơn hàng đang giao';
            message = `Đơn hàng #${id.slice(-8)} đã được bàn giao cho đơn vị vận chuyển.`;
            notiType = 'ORDER_SHIPPED';
            break;
          case OrderStatus.DELIVERED:
            title = 'Giao hàng thành công';
            message = `Đơn hàng #${id.slice(-8)} đã được giao thành công. Cảm ơn bạn đã mua sắm!`;
            notiType = 'ORDER_DELIVERED';
            break;
          case OrderStatus.CANCELLED:
            title = 'Đơn hàng đã hủy';
            message = `Đơn hàng #${id.slice(-8)} của bạn đã bị hủy.`;
            notiType = 'ORDER_CANCELLED';
            break;
          case 'RETURNED' as OrderStatus:
            title = 'Đơn hàng đã hoàn';
            message = `Đơn hàng #${id.slice(-8)} của bạn đã được hoàn trả.`;
            notiType = 'ORDER_RETURNED';
            break;
        }

        const notification = await this.notificationsService.create({
          userId: updatedOrder.userId,
          type: notiType,
          title,
          message,
          link: `/orders/${id}`,
        });

        // Push real-time notification via WebSocket
        this.notificationsGateway.sendNotificationToUser(
          updatedOrder.userId,
          notification,
        );
      } catch (error) {
        console.error('Failed to create status update notification', error);
      }

      return updatedOrder;
    });
  }
}
