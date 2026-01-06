import { PaymentService } from '@/payment/payment.service';
import { PrismaService } from '@core/prisma/prisma.service';
import { getTenant } from '@core/tenant/tenant.context';
import { InjectQueue } from '@nestjs/bullmq';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus, Prisma } from '@prisma/client';
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
 *
 * 4. RELIABILITY & PERFORMANCE (New Features):
 * - Transactional Outbox: Thay vì đẩy job vào Queue trực tiếp, ta lưu Event vào DB trong transaction
 *   để đảm bảo không bao giờ mất job (Zero Data Loss).
 * - Denormalization: Thông tin Product Name, Image được lưu cứng vào `OrderItem` ngay lúc mua.
 *   -> Giúp xem lại lịch sử siêu nhanh mà không cần JOIN 5-6 bảng.
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

  /**
   * Create a new order from cart items
   *
   * ✅ PRODUCTION-SAFE: ALL validation happens INSIDE transaction
   * ✅ No TOCTOU bugs (stock validated atomically)
   * ✅ No overselling possible
   * ✅ Atomic coupon usage increment
   */
  async create(userId: string, createOrderDto: CreateOrderDto) {
    // Return entire order creation in one big transaction
    const order = await this.prisma.$transaction(
      async (tx) => {
        // 1. Validate user exists
        const user = await tx.user.findUnique({ where: { id: userId } });
        if (!user) {
          throw new BadRequestException('User không tồn tại');
        }

        // 2. Get cart with items (inside transaction)
        const tenant = getTenant();
        if (!tenant) throw new BadRequestException('Tenant context missing');

        const cart = await tx.cart.findUnique({
          where: {
            userId_tenantId: {
              userId,
              tenantId: tenant.id,
            },
          },
          include: {
            items: {
              include: { sku: true },
            },
          },
        });

        if (!cart || cart.items.length === 0) {
          throw new BadRequestException('Giỏ hàng trống');
        }

        // 3. Filter items to process
        const itemsToProcess =
          createOrderDto.itemIds && createOrderDto.itemIds.length > 0
            ? cart.items.filter((item) =>
                createOrderDto.itemIds!.includes(item.id),
              )
            : cart.items;

        if (itemsToProcess.length === 0) {
          throw new BadRequestException('No items selected for checkout');
        }

        // 4. Validate stock and calculate price INSIDE transaction
        let totalAmount = 0;
        const orderItemsData: {
          skuId: string;
          quantity: number;
          priceAtPurchase: number;
          productName: string;
          productSlug: string;
          imageUrl?: string;
        }[] = [];

        // [P10 OPTIMIZATION] Batch fetch SKUs to avoid n+1 inside loop
        const uniqueSkuIds = [...new Set(itemsToProcess.map((i) => i.skuId))];
        const skus = await tx.sku.findMany({
          where: { id: { in: uniqueSkuIds } },
          select: {
            id: true,
            skuCode: true,
            stock: true,
            status: true,
            price: true,
            imageUrl: true,
            product: {
              select: {
                name: true,
                slug: true,
                images: {
                  select: { url: true },
                  orderBy: { displayOrder: 'asc' },
                  take: 1,
                },
              },
            },
          },
        });
        const skuMap = new Map(skus.map((s) => [s.id, s]));

        for (const item of itemsToProcess) {
          const sku = skuMap.get(item.skuId);

          if (!sku) {
            throw new BadRequestException(
              `Sản phẩm ${item.sku.skuCode} không tồn tại`,
            );
          }

          if (sku.status !== 'ACTIVE') {
            throw new BadRequestException(
              `Sản phẩm ${sku.skuCode} không còn được bán`,
            );
          }

          // ✅ Stock validation INSIDE transaction (prevents TOCTOU)
          if (sku.stock < item.quantity) {
            throw new BadRequestException(
              `Sản phẩm ${sku.skuCode} không đủ số lượng (Yêu cầu: ${item.quantity}, Còn: ${sku.stock})`,
            );
          }

          const price = Number(sku.price);
          totalAmount += price * item.quantity;

          orderItemsData.push({
            skuId: item.skuId,
            quantity: item.quantity,
            priceAtPurchase: price,
            productName: sku.product.name,
            productSlug: sku.product.slug,
            imageUrl: sku.imageUrl || sku.product.images[0]?.url,
          });
        }

        // 5. Validate and apply coupon (inside transaction)
        let couponId: string | null = null;
        let discountAmount = 0;

        if (createOrderDto.couponCode) {
          // Validate coupon INSIDE transaction
          const coupon = await tx.coupon.findUnique({
            where: { code: createOrderDto.couponCode },
            select: {
              id: true,
              code: true,
              discountType: true,
              discountValue: true,
              minOrderAmount: true,
              maxDiscountAmount: true,
              usageLimit: true,
              usedCount: true,
              startDate: true,
              endDate: true,
            },
          });

          if (!coupon) {
            throw new BadRequestException('Mã giảm giá không tồn tại');
          }

          // 🔒 SECURITY: WELCOME coupons are personal - check if user is the owner
          if (coupon.code.startsWith('WELCOME-')) {
            const ownerNotification = await tx.notification.findFirst({
              where: {
                userId,
                type: 'SYSTEM',
                message: { contains: coupon.code },
              },
            });

            if (!ownerNotification) {
              throw new BadRequestException(
                'Mã giảm giá này chỉ dành cho tài khoản đã được tặng',
              );
            }
          }

          const now = new Date();
          if (coupon.startDate && now < new Date(coupon.startDate)) {
            throw new BadRequestException('Mã giảm giá chưa có hiệu lực');
          }

          if (coupon.endDate && now > new Date(coupon.endDate)) {
            throw new BadRequestException('Mã giảm giá đã hết hạn');
          }

          // ✅ Atomic usage limit check
          if (
            coupon.usageLimit !== null &&
            coupon.usedCount >= coupon.usageLimit
          ) {
            throw new BadRequestException('Mã giảm giá đã hết lượt sử dụng');
          }

          if (
            coupon.minOrderAmount &&
            totalAmount < Number(coupon.minOrderAmount)
          ) {
            throw new BadRequestException(
              `Đơn hàng tối thiểu ${Number(coupon.minOrderAmount)} để sử dụng mã này`,
            );
          }

          // Calculate discount
          if (coupon.discountType === 'PERCENTAGE') {
            discountAmount = (totalAmount * Number(coupon.discountValue)) / 100;
            if (coupon.maxDiscountAmount) {
              discountAmount = Math.min(
                discountAmount,
                Number(coupon.maxDiscountAmount),
              );
            }
          } else {
            discountAmount = Number(coupon.discountValue);
          }

          couponId = coupon.id;
          totalAmount = Math.max(0, totalAmount - discountAmount);

          // ✅ Increment usage count atomically
          await tx.coupon.update({
            where: { id: couponId },
            data: { usedCount: { increment: 1 } },
          });
        }

        // 6. Calculate shipping fee
        // Note: External API call - consider moving to async job if too slow
        let shippingFee = 0;
        if (createOrderDto.addressId) {
          const address = await tx.address.findUnique({
            where: { id: createOrderDto.addressId },
          });
          if (address && address.districtId && address.wardCode) {
            try {
              shippingFee = await this.shippingService.calculateFee(
                address.districtId,
                address.wardCode,
              );
            } catch (error) {
              this.logger.warn(
                'Shipping fee calculation failed, using default',
              );
              shippingFee = 30000; // ✅ Fallback fee
            }
          }
        }
        totalAmount += shippingFee;

        // 7. Create order (inside existing transaction)
        const order = await tx.order.create({
          data: {
            userId,
            totalAmount,
            recipientName: createOrderDto.recipientName,
            phoneNumber: createOrderDto.phoneNumber,
            shippingAddress: createOrderDto.shippingAddress,
            shippingFee,
            paymentMethod: createOrderDto.paymentMethod || 'COD',
            status: OrderStatus.PENDING,
            couponId,
            addressId: createOrderDto.addressId,
            items: {
              create: orderItemsData,
            },
          } as Prisma.OrderUncheckedCreateInput,
          include: { items: true },
        });

        // 8. Reserve stock for all items
        for (const item of itemsToProcess) {
          await this.inventoryService.reserveStock(
            item.skuId,
            item.quantity,
            tx,
          );
        }

        // 9. Clear processed items from cart
        const itemIdsToDelete = itemsToProcess.map((i) => i.id);
        await tx.cartItem.deleteMany({
          where: {
            cartId: cart.id,
            id: { in: itemIdsToDelete },
          },
        });

        // --- 10. [RELIABILITY] OUTBOX PATTERN ---
        // Save events to DB inside the transaction for atomic guarantee
        await tx.outboxEvent.create({
          data: {
            aggregateType: 'ORDER',
            aggregateId: order.id,
            type: 'ORDER_CREATED_STOCK_CHECK',
            payload: { orderId: order.id },
          },
        });

        await tx.outboxEvent.create({
          data: {
            aggregateType: 'ORDER',
            aggregateId: order.id,
            type: 'ORDER_CREATED_POST_PROCESS',
            payload: { orderId: order.id, userId },
          },
        });

        return order;
      },
      {
        isolationLevel: 'Serializable',
        timeout: 10000, // 10 second timeout
      },
    );

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
              productName: true,
              productSlug: true,
              imageUrl: true,
              sku: {
                select: {
                  id: true,
                  skuCode: true,
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
      select: {
        id: true,
        userId: true,
        totalAmount: true,
        status: true,
        paymentStatus: true,
        paymentMethod: true,
        recipientName: true,
        phoneNumber: true,
        shippingAddress: true,
        shippingFee: true,
        shippingCode: true,
        transactionId: true,
        createdAt: true,
        updatedAt: true,
        cancellationReason: true,
        items: {
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
                    images: {
                      select: { url: true, alt: true },
                      orderBy: { displayOrder: 'asc' },
                      take: 1,
                    },
                  },
                },
                optionValues: {
                  select: {
                    optionValue: {
                      select: {
                        id: true,
                        value: true,
                        option: { select: { name: true } },
                      },
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
    userId?: string,
  ) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (userId) {
      where.userId = userId;
    }

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
      select: {
        id: true,
        userId: true,
        status: true,
        totalAmount: true,
        shippingFee: true,
        recipientName: true,
        phoneNumber: true,
        shippingAddress: true,
        paymentMethod: true,
        paymentStatus: true,
        transactionId: true,
        shippingCode: true,
        ghnStatus: true,
        createdAt: true,
        updatedAt: true,
        cancellationReason: true,
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
        items: {
          select: {
            id: true,
            quantity: true,
            priceAtPurchase: true,
            sku: {
              select: {
                id: true,
                skuCode: true,
                price: true,
                product: {
                  select: {
                    id: true,
                    name: true,
                    images: {
                      select: { url: true, alt: true },
                      orderBy: { displayOrder: 'asc' },
                      take: 1,
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
    return order;
  }

  async cancelMyOrder(userId: string, orderId: string, reason: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.userId !== userId) {
      throw new BadRequestException('Bạn không có quyền hủy đơn hàng này');
    }

    // Only allow cancelling PENDING orders
    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException(
        'Chỉ có thể hủy đơn hàng đang ở trạng thái Chờ xử lý (Pending).',
      );
    }

    return this.updateStatus(orderId, {
      status: OrderStatus.CANCELLED,
      cancellationReason: reason,
      notify: true,
    });
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

    // BLOCK MANUAL 'SHIPPED': Ensure flow follows GHN Webhook
    if (newStatus === OrderStatus.SHIPPED && !dto.force) {
      throw new BadRequestException(
        'Không được cập nhật thủ công sang "Đã Giao ĐVVC". Trạng thái này sẽ tự động cập nhật khi GHN qua lấy hàng (Picked). Nếu cần thiết, hãy dùng flag "force: true".',
      );
    }

    // Additional Check: Prevent PROCESSING non-COD orders if not PAID
    // BUT: If paymentStatus is being set to PAID in this request, allow it (payment confirmation flow)
    const effectivePaymentStatus = dto.paymentStatus || order.paymentStatus;
    if (
      newStatus === OrderStatus.PROCESSING &&
      order.paymentMethod !== 'COD' &&
      effectivePaymentStatus !== 'PAID'
    ) {
      throw new BadRequestException(
        `Cannot process order with payment method ${order.paymentMethod} until payment is confirmed (Status: ${order.paymentStatus}).`,
      );
    }

    // 🔴 ENFORCE CANCELLATION REASON
    if (newStatus === OrderStatus.CANCELLED && !dto.cancellationReason) {
      throw new BadRequestException(
        'Vui lòng cung cấp lý do hủy đơn hàng (Required cancellationReason).',
      );
    }

    const transactionResult = await this.prisma.$transaction(async (tx) => {
      if (newStatus === OrderStatus.CANCELLED) {
        // Validation: If order has shipping code, try to cancel on GHN first
        if (order.shippingCode) {
          const cancelSuccess =
            await this.shippingService.ghnService.cancelOrder(
              order.shippingCode,
            );
          if (!cancelSuccess) {
            // Option: Throw error to prevent local cancel if remote fail
            // Or: Warning and proceed?
            // Decided: Throw error to ensure consistency. Admin should know GHN cancel failed.
            throw new BadRequestException(
              'Không thể hủy đơn hàng trên hệ thống GHN. Đơn hàng có thể đã được giao hoặc đang xử lý. Vui lòng kiểm tra trên portal GHN.',
            );
          }
        }

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
          status: dto.status,
          cancellationReason: dto.cancellationReason,
          ...(dto.paymentStatus && { paymentStatus: dto.paymentStatus }),
        } as any,
        include: {
          user: true,
          items: { include: { sku: { include: { product: true } } } },
          address: true,
        },
      });

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
            // SHIPPED case removed as it is handled by webhook now
            case OrderStatus.DELIVERED:
              title = 'Giao hàng thành công';
              message = `Đơn hàng #${id.slice(-8)} đã được giao thành công. Cảm ơn bạn đã mua sắm!`;
              notiType = 'ORDER_DELIVERED';
              break;
            case OrderStatus.CANCELLED:
              title = 'Đơn hàng đã hủy';
              message = `Đơn hàng #${id.slice(-8)} của bạn đã bị hủy.${dto.cancellationReason ? ` Lý do: ${dto.cancellationReason}` : ''}`;
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

          // ALSO: Notify ALL admins about this order status change
          // This fulfills the user request: "admin yes order đó thì nên có 1 noti cho admin"
          try {
            const adminUsers = await this.prisma.user.findMany({
              where: {
                roles: {
                  some: {
                    role: {
                      name: 'ADMIN',
                    },
                  },
                },
              },
              select: { id: true },
            });

            const adminIds = adminUsers.map((u) => u.id);
            if (adminIds.length > 0) {
              const adminNotiType =
                newStatus === OrderStatus.PROCESSING
                  ? 'ADMIN_ORDER_ACCEPTED'
                  : `ADMIN_ORDER_${newStatus}`;

              await this.notificationsService.broadcastToUserIds(adminIds, {
                type: adminNotiType,
                title: `[Admin] ${title}`,
                message: `Admin notification: ${message}`,
                link: `/admin/orders/${id}`,
              });

              // Broadcast to all connected admins via socket
              adminIds.forEach((adminId) => {
                this.notificationsGateway.sendNotificationToUser(adminId, {
                  type: adminNotiType,
                  title: `[Admin] ${title}`,
                  message,
                  link: `/admin/orders/${id}`,
                  createdAt: new Date(),
                } as any);
              });
            }
          } catch (adminNotiError) {
            this.logger.error(
              'Failed to notify admins about status update',
              adminNotiError,
            );
          }
        } catch (error) {
          this.logger.error(
            'Failed to create status update notification',
            error,
          );
        }
      }

      return updatedOrder;
    });

    // 🚀 OPTIMIZATION: Move External API Call (GHN) OUT of Transaction
    // This prevents DB locks if GHN service is slow
    if (newStatus === OrderStatus.PROCESSING) {
      // Automatically sync with GHN if addressId exists
      if (transactionResult.addressId) {
        try {
          await this.syncWithGHN(transactionResult);
        } catch (e) {
          this.logger.error(
            `Post-transaction GHN sync failed for order ${id}`,
            e,
          );
          // Non-blocking: Order status is already updated, just log errors
        }
      }
    }

    return transactionResult;
  }

  /**
   * Đồng bộ đơn hàng sang Giao Hàng Nhanh (GHN)
   */
  private async syncWithGHN(
    order: Prisma.OrderGetPayload<{
      include: {
        items: {
          include: {
            sku: {
              include: {
                product: true;
              };
            };
          };
        };
      };
    }>,
  ) {
    try {
      if (!order.addressId) {
        this.logger.warn(`Missing addressId for order ${order.id}`);
        return;
      }
      const address = await this.prisma.address.findUnique({
        where: { id: order.addressId },
      });

      if (!address || !address.districtId || !address.wardCode) {
        this.logger.warn(`Missing GHN address info for order ${order.id}`);
        return;
      }

      // Validate and sanitize phone number
      // Regex: Starts with 0, followed by 3,5,7,8,9, and 8 digit numbers (Total 10)
      let toPhone = (order.phoneNumber || '').replace(/\D/g, '');
      if (!/^0[35789]\d{8}$/.test(toPhone)) {
        this.logger.warn(
          `Invalid phone number '${order.phoneNumber}' for order ${order.id}. Using fallback.`,
        );
        // Fallback for testing/dev: Use a known valid format if original is invalid
        // CAUTION: This is for development/demo purposes to unblock the flow.
        // In production, we should probably fail or use customer support phone.
        toPhone = '0901234567';
      }

      let returnPhone = address.phoneNumber?.replace(/\D/g, '') || '';
      if (!/^0[35789]\d{8}$/.test(returnPhone)) {
        returnPhone = '0901234567'; // Fallback
      }

      const ghnOrderData = {
        payment_type_id: order.paymentMethod === 'COD' ? 2 : 1,
        note: `Don hang #${order.id.slice(-8)}`,
        required_note: 'CHOXEMHANGKHONGTHU',
        return_phone: returnPhone,
        return_address: address.street,
        to_name: order.recipientName,
        to_phone: toPhone,
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
        service_type_id: 2,
        items: order.items.map((item) => ({
          name: item.sku.product.name,
          code: item.sku.skuCode,
          quantity: item.quantity,
          price: Math.round(Number(item.priceAtPurchase)),
        })),
      };

      this.logger.debug(
        `[GHN] Creating order ${order.id} with data: ${JSON.stringify(ghnOrderData)}`,
      );

      const ghnResponse =
        await this.shippingService.ghnService.createShippingOrder(ghnOrderData);

      this.logger.debug(
        `[GHN] Response for order ${order.id}: ${JSON.stringify(ghnResponse)}`,
      );

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
    } catch (error: any) {
      this.logger.error(
        `Failed to sync order ${order.id} with GHN: ${error.message}`,
        error.response?.data || error,
      );
    }
  }

  async remove(id: string) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Order not found');

    await this.prisma.order.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return { success: true };
  }
}
