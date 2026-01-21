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
import { EmailService } from '@integrations/email/email.service';
import { LoyaltyService } from '@/marketing/loyalty/loyalty.service';
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
 *   -> Giúp xem lại lịch sử siêu nhanh mà không cần JOIN 5-6 bảng. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Xử lý quy trình thanh toán, trừ tồn kho kho hàng, tính toán khuyến mãi và điều phối giao vận (Fulfillment).

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
    @Inject(forwardRef(() => PaymentService))
    private readonly paymentService: PaymentService,
    @InjectQueue('email-queue') private readonly emailQueue: Queue,
    @InjectQueue('orders-queue') private readonly ordersQueue: Queue, // Added orders-queue
    private readonly shippingService: ShippingService,
    private readonly inventoryService: InventoryService,
    private readonly emailService: EmailService,
    private readonly notificationsService: NotificationsService,
    private readonly notificationsGateway: NotificationsGateway,
    private readonly loyaltyService: LoyaltyService,
    private readonly promotionsService: PromotionsService,
    private readonly ordersRepo: OrdersRepository,
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
    // 0. Lấy context Tenant hiện tại (Cửa hàng nào?)
    const tenant = getTenant();
    if (!tenant)
      throw new BadRequestException(
        'Không xác định được Cửa hàng hiện tại (Tenant context missing)',
      );

    // Bọc toàn bộ quá trình tạo đơn hàng trong 1 Transaction lớn
    const order = await this.prisma.$transaction(
      async (tx) => {
        // 1. Kiểm tra User có tồn tại không
        const user = await tx.user.findUnique({ where: { id: userId } });
        if (!user) {
          throw new BadRequestException('User không tồn tại');
        }

        // 2. Lấy giỏ hàng và chi tiết sản phẩm (Trong cùng transaction để đảm bảo dữ liệu mới nhất)
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

        // 3. Lọc ra các sản phẩm user muốn mua (nếu chọn checkbox) hoặc mua tất cả
        const itemsToProcess =
          createOrderDto.itemIds && createOrderDto.itemIds.length > 0
            ? cart.items.filter((item) =>
                createOrderDto.itemIds!.includes(item.id),
              )
            : cart.items;

        if (itemsToProcess.length === 0) {
          throw new BadRequestException('Chưa chọn sản phẩm nào để thanh toán');
        }

        // 4. Validate tồn kho và tính giá tiền (Ngay trong Transaction)
        let totalAmount = 0;
        const orderItemsData: {
          skuId: string;
          quantity: number;
          priceAtPurchase: number;
          productName: string;
          skuNameSnapshot: string;
          productSlug: string;
          imageUrl?: string;
          tenantId: string;
        }[] = [];

        // [TỐI ƯU HÓA] Batch fetch (lấy một lần) các SKU để tránh lỗi N+1 Queries trong vòng lặp
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

          // ✅ Quan trọng: Check tồn kho trong Transaction (Chặn đứng mọi user khác đang mua cùng lúc)
          if (sku.stock < item.quantity) {
            throw new BadRequestException(
              `Sản phẩm ${sku.skuCode} không đủ số lượng (Yêu cầu: ${item.quantity}, Còn: ${sku.stock})`,
            );
          }

          const price = Number(sku.price);
          // [MATH SAFETY] Round to nearest integer for VND to avoid floating point errors
          totalAmount += Math.round(price * item.quantity);

          // Tạo tên snapshot cho SKU (VD: "Áo Thun (Đỏ - M)") để lưu cứng vào đơn hàng
          // Giúp admin xem lại đơn hàng cũ vẫn thấy đúng tên sản phẩm lúc mua, dù sau này sản phẩm có bị đổi tên.
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

        // 5. Kiểm tra và Áp dụng Mã giảm giá (Promotion Engine)
        let discountAmount = 0;
        let appliedPromotionId: string | undefined = undefined;

        if (createOrderDto.couponCode) {
          try {
            const promoResult = await this.promotionsService.validatePromotion({
              code: createOrderDto.couponCode,
              totalAmount,
              userId,
              items: orderItemsData.map((item) => ({
                skuId: item.skuId,
                quantity: item.quantity,
                price: item.priceAtPurchase,
              })),
            });

            if (promoResult.valid) {
              appliedPromotionId = promoResult.promotionId;
              discountAmount = promoResult.discountAmount;

              // ✅ Atomic Increment: Tăng số lượt sử dụng trong transaction
              await (tx as any).promotion.update({
                where: { id: appliedPromotionId },
                data: { usedCount: { increment: 1 } },
              });

              totalAmount = Math.max(0, totalAmount - discountAmount);
              this.logger.log(
                `Đã áp dụng mã ${createOrderDto.couponCode}: Giảm ${discountAmount}đ`,
              );
            }
          } catch (error) {
            this.logger.warn(
              `Không thể áp dụng mã ${createOrderDto.couponCode}: ${error.message}`,
            );
            // Có thể chọn throw lỗi hoặc chỉ log warning tùy nghiệp vụ.
            // Ở đây ta throw lỗi để user biết mã không hợp lệ.
            throw error;
          }
        }

        // 6. Tính phí vận chuyển (Shipping Fee)
        // Lưu ý: Gọi API bên ngoài có thể chậm, cân nhắc đưa vào background job nếu cần tối ưu tốc độ.
        let shippingFee = 0;
        let recipientName = createOrderDto.recipientName;
        let phoneNumber = createOrderDto.phoneNumber;
        let shippingAddressSnapshot: Record<string, unknown> | null = null;
        let shippingCity = createOrderDto.shippingCity || null;
        let shippingDistrict = createOrderDto.shippingDistrict || null;
        let shippingWard = createOrderDto.shippingWard || null;
        let shippingPhone =
          createOrderDto.shippingPhone || createOrderDto.phoneNumber;

        if (createOrderDto.addressId) {
          const address = await tx.address.findUnique({
            where: { id: createOrderDto.addressId },
          });
          if (address) {
            shippingAddressSnapshot = address;
            recipientName = address.recipientName;
            phoneNumber = address.phoneNumber;
            shippingCity = address.city;
            shippingDistrict = address.district;
            shippingWard = address.ward;
            shippingPhone = address.phoneNumber;

            // 6.a Lấy cấu hình phí vận chuyển của Tenant
            const settings = await (tx as any).tenantSettings.findUnique({
              where: { tenantId: tenant.id },
            });

            if (address.districtId && address.wardCode) {
              try {
                shippingFee = await this.shippingService.calculateFee(
                  address.districtId,
                  address.wardCode,
                );
              } catch (error) {
                this.logger.warn(
                  'Lỗi tính phí vận chuyển từ GHN, sử dụng phí từ Settings',
                );
                // Lấy phí mặc định từ Settings hoặc 30k nếu chưa set
                shippingFee = settings
                  ? Number(settings.defaultShippingFee)
                  : 30000;
              }
            }

            // 6.b Kiểm tra ngưỡng Miễn phí vận chuyển (Free Shipping Threshold)
            if (settings?.freeShippingThreshold) {
              const threshold = Number(settings.freeShippingThreshold);
              // Lưu ý: totalAmount lúc này chưa bao gồm phí ship mới
              if (totalAmount >= threshold) {
                this.logger.log(
                  `FREE SHIPPING: Total ${totalAmount} >= ${threshold}`,
                );
                shippingFee = 0;
              }
            }
          }
        }
        totalAmount += shippingFee;

        // 7. Tạo đơn hàng (Order) vào Database
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
            // Link to new promotion system
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

        // 8. Trừ tồn kho (Reserve Stock) cho từng sản phẩm
        for (const item of itemsToProcess) {
          await this.inventoryService.reserveStock(
            item.skuId,
            item.quantity,
            tx,
          );
        }

        // 9. Xóa các sản phẩm đã mua khỏi giỏ hàng
        const itemIdsToDelete = itemsToProcess.map((i) => i.id);
        await tx.cartItem.deleteMany({
          where: {
            cartId: cart.id,
            id: { in: itemIdsToDelete },
          },
        });

        // --- 10. [RELIABILITY] OUTBOX PATTERN (Đảm bảo độ tin cậy) ---
        // Thay vì gửi event ngay, ta lưu event vào DB cùng transaction.
        // Worker sẽ đọc bảng OutboxEvent và xử lý sau (Gửi email, bắn thông báo...).
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
        isolationLevel: 'Serializable', // Mức cô lập cao nhất: Chặn hoàn toàn các transaction khác can thiệp
        timeout: 10000, // Timeout 10 giây để tránh deadlock treo hệ thống
      },
    );

    let paymentUrl: string | undefined;
    let providerTransactionId: string | undefined;

    // Xử lý thanh toán Online (Momo, VNPAY...) sau khi transaction DB thành công
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

        // 5. Cập nhật trạng thái thanh toán (nếu có)
        if (paymentResult.success) {
          paymentUrl = paymentResult.paymentUrl;
          providerTransactionId = paymentResult.transactionId;

          // Tạo bản ghi lịch sử thanh toán
          await (this.prisma as any).payment.create({
            data: {
              orderId: order.id,
              amount: order.totalAmount,
              paymentMethod: createOrderDto.paymentMethod,
              status: paymentUrl ? 'PENDING' : 'PAID',
              providerTransactionId: providerTransactionId,
              tenantId: tenant.id,
            },
          });

          // Nếu thanh toán thành công ngay lập tức (không cần redirect URL) -> Update đơn thành PAID
          if (!paymentUrl) {
            await this.ordersRepo.update(order.id, {
              paymentStatus: 'PAID',
              transactionId: providerTransactionId,
            });
            order.paymentStatus = 'PAID';
          }
        }
      } else if (createOrderDto.paymentMethod === 'COD') {
        // Log transaction COD
        await (this.prisma as any).payment.create({
          data: {
            orderId: order.id,
            amount: order.totalAmount,
            paymentMethod: createOrderDto.paymentMethod,
            status: 'PAID', // COD is considered paid at the time of order creation for internal tracking
            providerTransactionId: 'COD-' + order.id, // Unique ID for COD
            tenantId: tenant.id,
          },
        });
      }
    } catch (error) {
      this.logger.error(`Lỗi xử lý thanh toán cho đơn hàng ${order.id}`, error);
      // Không throw lỗi ở đây để tránh làm user hoang mang, đơn hàng đã tạo thành công
      // User có thể thanh toán lại sau.
    }

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
    const order = await this.ordersRepo.findFirst({
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
    // [TEMPORARY BYPASS] User requested to allow manual trigger
    // if (newStatus === OrderStatus.SHIPPED && !dto.force) {
    //   throw new BadRequestException(
    //     'Không được cập nhật thủ công sang "Đã Giao ĐVVC". Trạng thái này sẽ tự động cập nhật khi GHN qua lấy hàng (Picked). Nếu cần thiết, hãy dùng flag "force: true".',
    //   );
    // }

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
        const orderWithItems = order as any;
        if (orderWithItems.items) {
          for (const item of orderWithItems.items) {
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

        if ((emailStatuses as any[]).includes(newStatus)) {
          // 🚀 TỐI ƯU: Fire-and-forget (Gửi background)
          this.emailService.sendOrderStatusUpdate(updatedOrder).catch((e) => {
            this.logger.error('Lỗi gửi email cập nhật trạng thái', e);
          });
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
            // SHIPPED được xử lý bởi webhook riêng
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

          // ĐỒNG THỜI: Thông báo cho tất cả Admin về sự thay đổi này
          // Đáp ứng yêu cầu: "admin yes order đó thì nên có 1 noti cho admin"
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

              // 🚀 TỐI ƯU: Broadcast không chặn (Non-blocking)
              this.notificationsService
                .broadcastToUserIds(adminIds, {
                  type: adminNotiType,
                  title: `[Admin] ${title}`,
                  message: `Admin notification: ${message}`,
                  link: `/admin/orders/${id}`,
                })
                .catch((e) =>
                  this.logger.error('Lỗi broadcast thông báo cho admin', e),
                );

              // Gửi qua Socket trực tiếp cho Admin đang online
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
            this.logger.error('Lỗi thông báo cho admin', adminNotiError);
          }
        } catch (error) {
          this.logger.error('Lỗi tạo thông báo cập nhật trạng thái', error);
        }
      }

      return updatedOrder;
    });

    // 🚀 TỐI ƯU HÓA: Đưa việc gọi API bên thứ 3 (GHN) ra KHỎI Transaction
    // VÀ: Chạy ngầm (Non-blocking)
    if (newStatus === OrderStatus.PROCESSING) {
      // Tự động đồng bộ với GHN nếu có địa chỉ
      if (transactionResult.addressId) {
        // Fire and forget GHN sync
        this.syncWithGHN(transactionResult as any).catch((e) => {
          this.logger.error(
            `Đồng bộ GHN nền thất bại cho đơn ${transactionResult.id}`,
            e,
          );
        });
      }
    }

    // 🎁 AUTO-EARN LOYALTY POINTS khi đơn hàng được giao thành công
    if (newStatus === OrderStatus.DELIVERED) {
      const tenant = getTenant();
      if (tenant) {
        this.loyaltyService.earnPointsFromOrder(tenant.id, id).catch((e) => {
          this.logger.error(
            `Lỗi tích điểm loyalty cho đơn ${id}: ${e.message}`,
          );
        });
      }
    }

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
        await (this.prisma as any).payment.create({
          data: {
            orderId: order.id,
            amount: order.totalAmount,
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
        await (this.prisma as any).payment.create({
          data: {
            orderId: order.id,
            amount: order.totalAmount,
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

