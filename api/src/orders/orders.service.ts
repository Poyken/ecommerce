/* eslint-disable @typescript-eslint/no-unsafe-enum-comparison */
import { PaymentService } from '@/payment/payment.service';
import { PrismaService } from '@core/prisma/prisma.service';
import { InjectQueue } from '@nestjs/bullmq';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus } from '@prisma/client';
import { Queue } from 'bullmq';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

import { CouponsService } from '@/coupons/coupons.service';
import { NotificationsGateway } from '@/notifications/notifications.gateway';
import { NotificationsService } from '@/notifications/notifications.service';
import { ShippingService } from '@/shipping/shipping.service';
import { InventoryService } from '@/skus/inventory.service';
import { EmailService } from '@integrations/email/email.service';
import { Logger } from '@nestjs/common';

/**
 * =====================================================================
 * ORDERS SERVICE - LOGIC XỬ LÝ ĐƠN HÀNG
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. DATABASE TRANSACTION ($transaction):
 * - Đây là kỹ thuật QUAN TRỌNG NHẤT khi xử lý đơn hàng.
 * - Mọi thao tác: Tạo Order, Trừ tồn kho (Stock), Xóa giỏ hàng -> Phải nằm trong 1 transaction.
 * - Nếu 1 bước lỗi -> Mọi thứ rollback về ban đầu. KHÔNG BAO GIỜ có chuyện tạo đơn xong mà kho không trừ, hoặc kho trừ mà đơn không tạo.
 *
 * 2. BACKGROUND JOBS (BullMQ):
 * - Sau khi tạo đơn, các tác vụ phụ như: Gửi Email xác nhận, Auto-cancel nếu không thanh toán...
 *   được đẩy vào hàng đợi (`ordersQueue`) để xử lý bất đồng bộ (Async).
 * - Giúp API phản hồi nhanh (Low Latency) cho user, không bắt user chờ email gửi xong mới báo thành công.
 *
 * 3. 3RD PARTY INTEGRATION:
 * - Service này tích hợp chặt chẽ với Payment (VNPAY/MoMo) và Shipping (GHN).
 * - Logic đồng bộ trạng thái đơn hàng (Sync GHN) được tự động kích hoạt khi đơn chuyển sang 'PROCESSING'.
 * =====================================================================
 */

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  // GHN Configuration defaults
  private readonly DEFAULT_HEIGHT = 10;
  private readonly DEFAULT_LENGTH = 10;
  private readonly DEFAULT_WIDTH = 10;
  private readonly DEFAULT_WEIGHT = 1000; // 1kg

  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentService: PaymentService,
    @InjectQueue('email-queue') private readonly emailQueue: Queue,
    @InjectQueue('orders-queue') private readonly ordersQueue: Queue, // Added orders-queue
    private readonly couponsService: CouponsService,
    private readonly shippingService: ShippingService,
    private readonly inventoryService: InventoryService,
    private readonly emailService: EmailService,
    private readonly notificationsService: NotificationsService,
    private readonly notificationsGateway: NotificationsGateway,
  ) {}

  async create(userId: string, createOrderDto: CreateOrderDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('User không tồn tại');

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

    const order = await this.prisma.$transaction(async (tx) => {
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
          addressId: createOrderDto.addressId,
          items: {
            create: orderItemsData,
          },
        } as any,
        include: { items: true },
      });

      for (const item of itemsToProcess) {
        await this.inventoryService.reserveStock(item.skuId, item.quantity, tx);
      }

      const itemIdsToDelete = itemsToProcess.map((i) => i.id);
      await tx.cartItem.deleteMany({
        where: {
          cartId: cart.id,
          id: { in: itemIdsToDelete },
        },
      });

      if (couponId) {
        // [P0] Atomic re-verify usageLimit inside transaction to prevent race conditions
        const coupon = await tx.coupon.findUnique({
          where: { id: couponId },
          select: { id: true, usageLimit: true, usedCount: true },
        });

        if (
          coupon &&
          coupon.usageLimit !== null &&
          coupon.usedCount >= coupon.usageLimit
        ) {
          throw new BadRequestException('Mã giảm giá vừa hết lượt sử dụng');
        }

        await tx.coupon.update({
          where: { id: couponId },
          data: { usedCount: { increment: 1 } },
        });
      }

      return newOrder;
    });

    // --- SCHEDULE STOCK RELEASE JOB (15 Minutes) ---
    try {
      await this.ordersQueue.add(
        'check-stock-release',
        { orderId: order.id },
        {
          delay: 15 * 60 * 1000, // 15 mins delay
        },
      );
    } catch (e) {
      this.logger.error(
        `Failed to schedule stock release check for order ${order.id}`,
        e,
      );
    }
    // -----------------------------------------------

    let paymentUrl: string | undefined;

    try {
      if (createOrderDto.paymentMethod) {
        const paymentResult = await this.paymentService.processPayment(
          createOrderDto.paymentMethod,
          {
            amount: Number(order.totalAmount),
            orderId: order.id,
            returnUrl: createOrderDto.returnUrl,
          },
        );

        if (paymentResult.success) {
          paymentUrl = paymentResult.paymentUrl;

          if (!paymentUrl) {
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
      this.logger.error(`Payment failed for order ${order.id}`, error);
    }

    // --- SCHEDULE POST-PROCESS JOB (Side Effects: Email, Noti) ---
    try {
      await this.ordersQueue.add('order-created-post-process', {
        orderId: order.id,
        userId: userId,
      });
    } catch (e) {
      this.logger.error(
        `Failed to schedule post-process for order ${order.id}`,
        e,
      );
    }

    return { ...order, paymentUrl };
  }

  async findAllByUser(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          totalAmount: true,
          status: true,
          paymentStatus: true,
          createdAt: true,
          shippingFee: true,
          shippingCode: true,
          items: {
            take: 3,
            select: {
              id: true,
              quantity: true,
              priceAtPurchase: true,
              sku: {
                select: {
                  id: true,
                  skuCode: true,
                  imageUrl: true,
                  product: {
                    select: {
                      id: true,
                      name: true,
                      slug: true,
                    },
                  },
                },
              },
            },
          },
        },
      }),
      this.prisma.order.count({ where: { userId } }),
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

    if (order.userId !== userId) {
      throw new BadRequestException('Bạn không có quyền xem đơn hàng này');
    }

    return order;
  }

  async findAll(
    search?: string,
    status?: string,
    page = 1,
    limit = 10,
    includeItems = false,
  ) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (status && status !== 'all') {
      where.status = status as OrderStatus;
    }
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

  async updateStatus(id: string, dto: UpdateOrderStatusDto) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!order) throw new NotFoundException('Order not found');

    const currentStatus = order.status;
    const newStatus = dto.status;

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
        isValid = false;
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
        data: {
          status: dto.status as OrderStatus,
          cancellationReason: dto.cancellationReason,
          ...(dto.paymentStatus && { paymentStatus: dto.paymentStatus as any }),
        },
        include: {
          user: true,
          items: { include: { sku: { include: { product: true } } } },
          address: true,
        } as any,
      });

      if (newStatus === OrderStatus.PROCESSING) {
        // Automatically sync with GHN if addressId exists
        if (updatedOrder.addressId) {
          await this.syncWithGHN(updatedOrder);
        }
      }

      if (dto.notify !== false) {
        // Send email notification for status changes
        const emailStatuses = [
          OrderStatus.PROCESSING,
          OrderStatus.SHIPPED,
          OrderStatus.DELIVERED,
          OrderStatus.CANCELLED,
        ];

        if ((emailStatuses as any[]).includes(newStatus)) {
          await this.emailService.sendOrderStatusUpdate(updatedOrder);
        }

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
            case 'RETURNED' as any:
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

          this.notificationsGateway.sendNotificationToUser(
            updatedOrder.userId,
            notification,
          );
        } catch (error) {
          this.logger.error(
            'Failed to create status update notification',
            error,
          );
        }
      }

      return updatedOrder;
    });
  }

  /**
   * Đồng bộ đơn hàng sang Giao Hàng Nhanh (GHN)
   */
  private async syncWithGHN(order: any) {
    try {
      const address = await this.prisma.address.findUnique({
        where: { id: order.addressId },
      });

      if (!address || !address.districtId || !address.wardCode) {
        this.logger.warn(`Missing GHN address info for order ${order.id}`);
        return;
      }

      const ghnOrderData = {
        payment_type_id: order.paymentMethod === 'COD' ? 2 : 1, // 2: Guest pays shipping, 1: Shop pays shipping (adjusted by business)
        note: `Don hang #${order.id.slice(-8)}`,
        required_note: 'CHOXEMHANGKHONGTHU',
        return_phone: address.phoneNumber,
        return_address: address.street,
        to_name: order.recipientName,
        to_phone: order.phoneNumber,
        to_address: order.shippingAddress,
        to_ward_code: address.wardCode,
        to_district_id: address.districtId,
        cod_amount:
          order.paymentStatus === 'PAID' ? 0 : Number(order.totalAmount),
        content: `Don hang tu Poyken E-commerce`,
        weight: this.DEFAULT_WEIGHT,
        length: this.DEFAULT_LENGTH,
        width: this.DEFAULT_WIDTH,
        height: this.DEFAULT_HEIGHT,
        service_type_id: 2, // E-commerce service
        items: order.items.map((item) => ({
          name: item.sku.product.name,
          code: item.sku.skuCode,
          quantity: item.quantity,
          price: Number(item.priceAtPurchase),
        })),
      };

      const ghnResponse =
        await this.shippingService.ghnService.createShippingOrder(ghnOrderData);

      // Save GHN Tracking Code to Order
      await this.prisma.order.update({
        where: { id: order.id },
        data: {
          shippingCode: ghnResponse.order_code,
        } as any,
      });

      this.logger.log(
        `Synced order ${order.id} with GHN: ${ghnResponse.order_code}`,
      );
    } catch (error) {
      this.logger.error(`Failed to sync order ${order.id} with GHN`, error);
    }
  }
}
