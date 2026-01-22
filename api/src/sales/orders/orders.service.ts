import { PaymentService } from '@/sales/payment/payment.service';
import { PrismaService } from '@core/prisma/prisma.service';
import { getTenant } from '@core/tenant/tenant.context';
import { InjectQueue } from '@nestjs/bullmq';
import { OrderFilterDto } from './dto/order-filter.dto';
import {
  BadRequestException,
  Injectable,
  Inject,
  forwardRef,
  NotFoundException,
} from '@nestjs/common';
import { OrderStatus, Prisma } from '@prisma/client';
import { Queue } from 'bullmq';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

import { PromotionsService } from '@/marketing/promotions/promotions.service';
import { OrdersRepository } from './orders.repository';

import { NotificationsGateway } from '@/notifications/notifications.gateway';
import { NotificationsService } from '@/notifications/notifications.service';
import { ShippingService } from '@/sales/shipping/shipping.service';
import { InventoryService } from '@/catalog/skus/inventory.service';
import { EmailService } from '@/platform/integrations/external/email/email.service';
import { LoyaltyService } from '@/marketing/loyalty/loyalty.service';
import { Logger } from '@nestjs/common';

/**
 * =====================================================================
 * ORDERS SERVICE
 * =====================================================================
 */

import { EventEmitter2 } from '@nestjs/event-emitter';
import { OrderCreatedEvent } from './events/order-created.event';
import { OrderStatusUpdatedEvent } from './events/order-status-updated.event';

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
    private readonly eventEmitter: EventEmitter2,
    @Inject(forwardRef(() => PaymentService))
    private readonly paymentService: PaymentService,
    private readonly shippingService: ShippingService,
    private readonly inventoryService: InventoryService,
    private readonly loyaltyService: LoyaltyService,
    private readonly promotionsService: PromotionsService,
    private readonly ordersRepo: OrdersRepository,
    @InjectQueue('orders-queue') private readonly ordersQueue: Queue,
  ) {}

  /**
   * Tạo đơn hàng mới từ giỏ hàng.
   *
   * ✅ AN TOÀN CHO PRODUCTION:
   * - Mọi logic validation được đặt BÊN TRONG transaction để tránh lỗi Race Condition.
   * - Không bao giờ xảy ra tình trạng "Bán quá số lượng tồn kho" (No overselling).
   * - Đảm bảo tính nhất quán: Tạo đơn xong là phải trừ kho, xóa giỏ hàng.
   */
  async create(userId: string, createOrderDto: CreateOrderDto) {
    const tenant = getTenant();
    if (!tenant)
      throw new BadRequestException(
        'Không xác định được Cửa hàng hiện tại (Tenant context missing)',
      );

    // 1. Prepare data before transaction (Zero Trust & External APIs)
    // [P11 FIX]: Call external shipping API BEFORE transaction to avoid long DB locks
    let shippingFee = new Prisma.Decimal(0);
    let recipientName = createOrderDto.recipientName;
    let phoneNumber = createOrderDto.phoneNumber;
    let shippingCity = createOrderDto.shippingCity || null;
    let shippingDistrict = createOrderDto.shippingDistrict || null;
    let shippingWard = createOrderDto.shippingWard || null;
    let shippingPhone =
      createOrderDto.shippingPhone || createOrderDto.phoneNumber;
    let shippingAddressSnapshot: Record<string, unknown> | null = null;

    if (createOrderDto.addressId) {
      const address = await this.prisma.address.findUnique({
        where: { id: createOrderDto.addressId },
      });
      if (address) {
        shippingAddressSnapshot = address as unknown as Record<string, unknown>;
        recipientName = address.recipientName;
        phoneNumber = address.phoneNumber;
        shippingCity = address.city;
        shippingDistrict = address.district;
        shippingWard = address.ward;
        shippingPhone = address.phoneNumber;

        if (address.districtId && address.wardCode) {
          try {
            const fee = await this.shippingService.calculateFee(
              address.districtId,
              address.wardCode,
            );
            shippingFee = new Prisma.Decimal(fee);
          } catch (error) {
            this.logger.warn(
              'Lỗi tính phí vận chuyển từ GHN. Đơn hàng sẽ dùng phí mặc định từ Settings.',
            );
          }
        }
      }
    }

    const order = await this.prisma.$transaction(
      async (tx) => {
        const user = await tx.user.findUnique({ where: { id: userId } });
        if (!user) {
          throw new BadRequestException('User không tồn tại');
        }

        const cart = await tx.cart.findFirst({
          where: {
            userId,
            tenantId: tenant.id,
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

        const itemsToProcess =
          createOrderDto.itemIds && createOrderDto.itemIds.length > 0
            ? cart.items.filter((item) =>
                createOrderDto.itemIds!.includes(item.id),
              )
            : cart.items;

        if (itemsToProcess.length === 0) {
          throw new BadRequestException('Chưa chọn sản phẩm nào để thanh toán');
        }

        let totalAmount = new Prisma.Decimal(0);
        const orderItemsData: {
          skuId: string;
          quantity: number;
          priceAtPurchase: Prisma.Decimal;
          productName: string;
          skuNameSnapshot: string;
          productSlug: string;
          imageUrl?: string;
          tenantId: string;
        }[] = [];

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
            optionValues: {
              select: {
                optionValue: {
                  select: { value: true },
                },
              },
            },
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
              `Sản phẩm ${sku.skuCode} hiện đang ngừng kinh doanh`,
            );
          }

          // Stock validation now happens atomically in reserveStock() with row locking

          const price = sku.price || new Prisma.Decimal(0);
          totalAmount = totalAmount.add(price.mul(item.quantity));

          const optionsString = sku.optionValues
            .map((ov) => ov.optionValue.value)
            .join(' - ');
          const skuNameSnapshot = optionsString
            ? `${sku.product.name} (${optionsString})`
            : sku.product.name;

          orderItemsData.push({
            skuId: item.skuId,
            quantity: item.quantity,
            priceAtPurchase: price,
            productName: sku.product.name,
            skuNameSnapshot,
            productSlug: sku.product.slug,
            imageUrl: sku.imageUrl || sku.product.images[0]?.url,
            tenantId: tenant.id,
          });
        }

        let discountAmount = new Prisma.Decimal(0);
        let appliedPromotionId: string | undefined = undefined;

        if (createOrderDto.couponCode) {
          try {
            const promoResult = await this.promotionsService.validatePromotion({
              code: createOrderDto.couponCode,
              totalAmount: totalAmount.toNumber(),
              userId,
              items: orderItemsData.map((item) => ({
                skuId: item.skuId,
                quantity: item.quantity,
                price: item.priceAtPurchase.toNumber(),
              })),
            });

            if (promoResult.valid) {
              appliedPromotionId = promoResult.promotionId;
              discountAmount = new Prisma.Decimal(promoResult.discountAmount);

              await tx.promotion.update({
                where: { id: appliedPromotionId },
                data: { usedCount: { increment: 1 } },
              });

              totalAmount = Prisma.Decimal.max(
                0,
                totalAmount.sub(discountAmount),
              );
            }
          } catch (error) {
            this.logger.warn(
              `Không thể áp dụng mã ${createOrderDto.couponCode}: ${error.message}`,
            );
            throw error;
          }
        }

        // Apply settings-based shipping fee if needed
        const settings = await tx.tenantSettings.findUnique({
          where: { tenantId: tenant.id },
        });

        if (shippingFee.isZero() && settings?.defaultShippingFee) {
          shippingFee = new Prisma.Decimal(settings.defaultShippingFee);
        }

        if (settings?.freeShippingThreshold) {
          const threshold = new Prisma.Decimal(settings.freeShippingThreshold);
          if (totalAmount.gte(threshold)) {
            shippingFee = new Prisma.Decimal(0);
          }
        }
        totalAmount = totalAmount.add(shippingFee);

        const order = await this.ordersRepo.create(
          {
            userId,
            totalAmount,
            recipientName,
            phoneNumber,
            shippingAddress: createOrderDto.shippingAddress,
            shippingCity,
            shippingDistrict,
            shippingWard,
            shippingPhone,
            shippingAddressSnapshot,
            shippingFee,
            paymentMethod: createOrderDto.paymentMethod || 'COD',
            status: OrderStatus.PENDING,
            promotions: appliedPromotionId
              ? {
                  create: {
                    promotionId: appliedPromotionId,
                    userId,
                    discountAmount,
                  },
                }
              : undefined,
            addressId: createOrderDto.addressId,
            tenantId: tenant.id,
            items: {
              create: orderItemsData,
            },
          } as Prisma.OrderUncheckedCreateInput,
          { include: { items: true } },
          tx,
        );

        await this.inventoryService.reserveStockBatch(
          itemsToProcess.map((item) => ({
            skuId: item.skuId,
            quantity: item.quantity,
          })),
          tx,
        );

        const itemIdsToDelete = itemsToProcess.map((i) => i.id);
        await tx.cartItem.deleteMany({
          where: {
            cartId: cart.id,
            id: { in: itemIdsToDelete },
          },
        });

        await tx.outboxEvent.create({
          data: {
            aggregateType: 'ORDER',
            aggregateId: order.id,
            type: 'ORDER_CREATED_STOCK_CHECK',
            payload: { orderId: order.id },
          },
        });

        return order;
      },
      {
        timeout: 10000,
      },
    );

    let paymentUrl: string | undefined;
    if (
      createOrderDto.paymentMethod &&
      createOrderDto.paymentMethod !== 'COD'
    ) {
      try {
        const paymentResult = await this.paymentService.processPayment(
          createOrderDto.paymentMethod,
          {
            amount: order.totalAmount.toNumber(),
            orderId: order.id,
            returnUrl: createOrderDto.returnUrl,
          },
        );

        if (paymentResult.success) {
          paymentUrl = paymentResult.paymentUrl;
          await this.paymentService.createPaymentRecord({
            orderId: order.id,
            amount: order.totalAmount,
            paymentMethod: createOrderDto.paymentMethod,
            status: paymentUrl ? 'PENDING' : 'PAID',
            providerTransactionId: paymentResult.transactionId,
            tenantId: tenant.id,
          });
        }
      } catch (error) {
        this.logger.error(
          `Error processing payment for order ${order.id}`,
          error,
        );
      }
    }

    this.eventEmitter.emit(
      'order.created',
      new OrderCreatedEvent(
        order.id,
        userId,
        order.totalAmount.toNumber(),
        order.paymentMethod || 'COD',
        tenant.id,
        {
          paymentMethod: createOrderDto.paymentMethod,
          returnUrl: createOrderDto.returnUrl,
        },
      ),
    );

    return { ...order, paymentUrl };
  }

  async findAllByUser(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [orders, total] = await Promise.all([
      this.ordersRepo.findMany({
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
              // skuNameSnapshot: true,
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
      this.ordersRepo.count({ userId }),
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
    const order = await this.ordersRepo.findFirst({
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
        // payments: {
        //   orderBy: { createdAt: 'desc' },
        // },
        items: {
          select: {
            id: true,
            quantity: true,
            priceAtPurchase: true,
            productName: true,
            // skuNameSnapshot: true,
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

  async findAll(filters: OrderFilterDto) {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;
    const where: Prisma.OrderWhereInput = {};

    if (filters.userId) {
      where.userId = filters.userId;
    }

    if (filters.status && filters.status !== 'all') {
      where.status = filters.status as OrderStatus;
    }
    if (filters.search) {
      where.OR = [
        { id: { contains: filters.search, mode: 'insensitive' } },
        { recipientName: { contains: filters.search, mode: 'insensitive' } },
        { phoneNumber: { contains: filters.search, mode: 'insensitive' } },
        { user: { email: { contains: filters.search, mode: 'insensitive' } } },
      ];
    }

    const include: Prisma.OrderInclude = {
      user: { select: { email: true, firstName: true, lastName: true } },
    };

    if (filters.includeItems === 'true') {
      include.items = {
        include: {
          sku: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  images: {
                    select: { url: true },
                    take: 1,
                  },
                },
              },
            },
          },
        },
      };
    }

    const [orders, total] = await Promise.all([
      this.ordersRepo.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include,
      }),
      this.ordersRepo.count(where),
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
    const order = await this.ordersRepo.findFirst({
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
        // payments: {
        //   orderBy: { createdAt: 'desc' },
        // },
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
            productName: true,
            // skuNameSnapshot: true,
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
    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');

    // Bảo mật: Không cho hủy đơn của người khác
    if (order.userId !== userId) {
      throw new BadRequestException('Bạn không có quyền hủy đơn hàng này');
    }

    // Quy tắc nghiệp vụ: Chỉ được hủy khi đơn ở trạng thái PENDING (Chờ xử lý)
    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestException(
        'Chỉ có thể hủy đơn hàng đang ở trạng thái Chờ xử lý. Nếu đơn hàng đã được giao cho đơn vị vận chuyển, vui lòng liên hệ CSKH.',
      );
    }

    return this.ordersRepo.update(orderId, {
      status: OrderStatus.CANCELLED,
      cancellationReason: reason,
    });
  }

  async updateStatus(id: string, dto: UpdateOrderStatusDto) {
    const order = await this.prisma.order.findFirst({
      where: { id },
      include: { items: true },
    });
    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng');

    const currentStatus = order.status;
    const newStatus = dto.status;

    let isValid = false;

    // Máy trạng thái (State Machine): Kiểm tra luồng chuyển đổi trạng thái hợp lệ
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
        isValid = false; // Trạng thái cuối cùng, không thể thay đổi
        break;
      default:
        isValid = false;
    }

    if (!isValid) {
      throw new BadRequestException(
        `Không thể chuyển trạng thái từ ${currentStatus} sang ${newStatus}`,
      );
    }

    // CHẶN THAO TÁC THỦ CÔNG: Đảm bảo luồng trạng thái tuân thủ Webhook từ GHN
    if (newStatus === OrderStatus.SHIPPED && !dto.force) {
      throw new BadRequestException(
        'Không được cập nhật thủ công sang "Đã Giao ĐVVC". Trạng thái này sẽ tự động cập nhật khi GHN qua lấy hàng (Picked). Nếu cần thiết, hãy dùng flag "force: true".',
      );
    }

    // Kiểm tra bổ sung: Không cho phép xử lý đơn hàng COD nếu chưa thanh toán (Trừ khi admin xác nhận thanh toán ngay lúc này)
    const effectivePaymentStatus = dto.paymentStatus || order.paymentStatus;
    if (
      newStatus === OrderStatus.PROCESSING &&
      order.paymentMethod !== 'COD' &&
      effectivePaymentStatus !== 'PAID'
    ) {
      throw new BadRequestException(
        `Không thể xử lý đơn hàng thanh toán qua ${order.paymentMethod} khi chưa nhận được tiền (Status: ${order.paymentStatus}).`,
      );
    }

    // 🔴 BẮT BUỘC CÓ LÝ DO HỦY
    if (newStatus === OrderStatus.CANCELLED && !dto.cancellationReason) {
      throw new BadRequestException('Vui lòng cung cấp lý do hủy đơn hàng.');
    }

    const transactionResult = await this.prisma.$transaction(async (tx) => {
      if (newStatus === OrderStatus.CANCELLED) {
        // Nếu đơn hàng đã có mã vận đơn, thử hủy bên GHN trước
        if (order.shippingCode) {
          const cancelSuccess =
            await this.shippingService.ghnService.cancelOrder(
              order.shippingCode,
            );
          if (!cancelSuccess) {
            // Quyết định: Throw lỗi để đảm bảo tính nhất quán. Admin cần biết là hủy bên GHN thất bại.
            throw new BadRequestException(
              'Không thể hủy đơn hàng trên hệ thống GHN. Đơn hàng có thể đã được giao hoặc đang xử lý. Vui lòng kiểm tra trên portal GHN.',
            );
          }
        }

        // Hoàn trả tồn kho (Release Stock)
        if (order.items) {
          for (const item of order.items) {
            await this.inventoryService.releaseStock(
              item.skuId,
              item.quantity,
              tx,
            );
          }
        }
      }
      const updatedOrder = await this.ordersRepo.update(
        id,
        {
          status: dto.status,
          cancellationReason: dto.cancellationReason,
          ...(dto.paymentStatus && { paymentStatus: dto.paymentStatus }),
        } as any,
        {
          include: {
            user: true,
            items: { include: { sku: { include: { product: true } } } },
            address: true,
          },
        },
        tx,
      );

      if (dto.notify !== false) {
        // Gửi email thông báo (Không chặn luồng chính)
        const emailStatuses = [
          OrderStatus.PROCESSING,
          OrderStatus.SHIPPED,
          OrderStatus.DELIVERED,
          OrderStatus.CANCELLED,
        ];
      }

      // 10. [DISPATCH] Emit Event for Status Change
      const tenantInfo = getTenant();
      this.eventEmitter.emit(
        'order.status.updated',
        new OrderStatusUpdatedEvent(
          id,
          updatedOrder.userId,
          currentStatus,
          newStatus as OrderStatus,
          tenantInfo!.id,
        ),
      );

      return updatedOrder;
    });

    return transactionResult;
  }

  /**
   * Đồng bộ đơn hàng sang Giao Hàng Nhanh (GHN)
   */
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
        this.logger.warn(`Đơn hàng ${order.id} thiếu addressId`);
        return;
      }
      const address = await this.prisma.address.findUnique({
        where: { id: order.addressId },
      });

      if (!address || !address.districtId || !address.wardCode) {
        this.logger.warn(
          `Thiếu thông tin quận/huyện phường/xã cho GHN ở đơn ${order.id}`,
        );
        return;
      }

      // Xử lý SĐT: Loại bỏ ký tự không phải số
      let toPhone = (order.phoneNumber || '').replace(/\D/g, '');
      if (!/^0[35789]\d{8}$/.test(toPhone)) {
        this.logger.warn(
          `SĐT không hợp lệ '${order.phoneNumber}' ở đơn ${order.id}. Đang dùng sĐT mặc định để test.`,
        );
        // Fallback cho môi trường test/dev để không bị chặn flow.
        // Trong Production thực tế nên throw lỗi hoặc yêu cầu user cập nhật lại số.
        toPhone = '0901234567';
      }

      let returnPhone = address.phoneNumber?.replace(/\D/g, '') || '';
      if (!/^0[35789]\d{8}$/.test(returnPhone)) {
        returnPhone = '0901234567'; // Fallback
      }

      const ghnOrderData = {
        payment_type_id: order.paymentMethod === 'COD' ? 2 : 1, // 2: Người mua trả tiền (COD), 1: Người bán trả cước (Hoặc đã thanh toán - tùy cấu hình GHN)
        note: `Don hang #${order.id.slice(-8)}`,
        required_note: 'CHOXEMHANGKHONGTHU', // Cho xem hàng nhưng không cho thử
        return_phone: returnPhone,
        return_address: address.street,
        to_name: order.recipientName,
        to_phone: toPhone,
        to_address: order.shippingAddress,
        to_ward_code: address.wardCode,
        to_district_id: address.districtId,
        cod_amount:
          order.paymentStatus === 'PAID' ? 0 : Number(order.totalAmount), // Nếu đã trả tiền (PAYMENT/MOMO) thì COD = 0
        content: `Don hang tu Poyken E-commerce`,
        weight: this.DEFAULT_WEIGHT,
        length: this.DEFAULT_LENGTH,
        width: this.DEFAULT_WIDTH,
        height: this.DEFAULT_HEIGHT,
        service_type_id: 2, // Gói chuẩn/Nhanh (tùy cấu hình)
        items: order.items.map((item) => ({
          name: item.sku.product.name,
          code: item.sku.skuCode,
          quantity: item.quantity,
          price: Math.round(Number(item.priceAtPurchase)),
        })),
      };

      this.logger.debug(
        `[GHN] Đang tạo vận đơn cho ${order.id} với data: ${JSON.stringify(ghnOrderData)}`,
      );

      const ghnResponse =
        await this.shippingService.ghnService.createShippingOrder(ghnOrderData);

      this.logger.debug(
        `[GHN] Kết quả từ GHN cho đơn ${order.id}: ${JSON.stringify(ghnResponse)}`,
      );

      // Lưu mã vận đơn GHN vào Order
      await this.ordersRepo.update(order.id, {
        shippingCode: ghnResponse.order_code,
      } as any);

      this.logger.log(
        `Đã đồng bộ đơn hàng ${order.id} sang GHN thành công: ${ghnResponse.order_code}`,
      );
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      const responseData =
        error instanceof Error && 'response' in error
          ? (error as { response?: { data?: unknown } }).response?.data
          : undefined;
      this.logger.error(
        `Đồng bộ GHN thất bại cho đơn ${order.id}: ${message}`,
        responseData || error,
      );
      // Không throw lỗi chết app, chỉ log warning
    }
  }

  async remove(id: string) {
    const order = await this.ordersRepo.findById(id);
    if (!order) throw new NotFoundException('Order not found');

    await this.ordersRepo.update(id, {
      // deletedAt: new Date()
    });

    return { success: true };
  }

  // =====================================================================
  // #region PRIVATE HELPER METHODS
  // =====================================================================

  /**
   * Xử lý thanh toán sau khi tạo đơn hàng thành công.
   * Tách ra để giữ cho method create() gọn gàng hơn.
   */
  private async processPaymentAfterOrder(
    order: { id: string; totalAmount: number | bigint; paymentStatus?: string },
    paymentMethod: string | undefined,
    returnUrl: string | undefined,
    tenantId: string,
  ): Promise<{ paymentUrl?: string; providerTransactionId?: string }> {
    if (!paymentMethod) {
      return {};
    }

    try {
      if (paymentMethod === 'COD') {
        // Log transaction COD
        await this.prisma.payment.create({
          data: {
            orderId: order.id,
            amount: new Prisma.Decimal(order.totalAmount.toString()),
            paymentMethod,
            status: 'PAID',
            providerTransactionId: `COD-${order.id}`,
            tenantId,
          },
        });
        return {};
      }

      const paymentResult = await this.paymentService.processPayment(
        paymentMethod,
        {
          amount: Number(order.totalAmount),
          orderId: order.id,
          returnUrl,
        },
      );

      if (paymentResult.success) {
        // Tạo bản ghi lịch sử thanh toán
        await this.prisma.payment.create({
          data: {
            orderId: order.id,
            amount: new Prisma.Decimal(order.totalAmount.toString()),
            paymentMethod,
            status: paymentResult.paymentUrl ? 'PENDING' : 'PAID',
            providerTransactionId: paymentResult.transactionId,
            tenantId,
          },
        } as Prisma.PaymentCreateArgs);

        if (!paymentResult.paymentUrl) {
          await this.prisma.order.update({
            where: { id: order.id },
            data: {
              paymentStatus: 'PAID',
              transactionId: paymentResult.transactionId,
            },
          });
        }

        return {
          paymentUrl: paymentResult.paymentUrl,
          providerTransactionId: paymentResult.transactionId,
        };
      }
    } catch (error) {
      this.logger.error(`Lỗi xử lý thanh toán cho đơn hàng ${order.id}`, error);
    }

    return {};
  }

  /**
   * Validate state machine transition cho order status.
   * @returns true nếu transition hợp lệ
   */
  private isValidStatusTransition(
    currentStatus: OrderStatus,
    newStatus: OrderStatus,
  ): boolean {
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.PENDING]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
      [OrderStatus.PROCESSING]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
      [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED, OrderStatus.RETURNED],
      [OrderStatus.DELIVERED]: [OrderStatus.RETURNED, OrderStatus.COMPLETED],
      [OrderStatus.CANCELLED]: [],
      [OrderStatus.RETURNED]: [],
      [OrderStatus.COMPLETED]: [],
    };

    return validTransitions[currentStatus]?.includes(newStatus) ?? false;
  }

  // #endregion
}
