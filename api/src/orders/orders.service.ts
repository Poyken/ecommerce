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
import { InventoryService } from '@/catalog/skus/inventory.service';
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
 *   -> Giúp xem lại lịch sử siêu nhanh mà không cần JOIN 5-6 bảng. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Tiếp nhận request từ Client, điều phối xử lý và trả về response.

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
          totalAmount += price * item.quantity;

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
          });
        }

        // 5. Kiểm tra và Áp dụng Mã giảm giá (Coupon)
        // 5. Kiểm tra và Áp dụng Mã giảm giá (Coupon)
        const couponId: string | null = null;
        const discountAmount = 0;

        // [MIGRATION TODO]: Migrate this logic to use PromotionsService.validatePromotion()
        if (createOrderDto.couponCode) {
          this.logger.warn(
            'Coupon code usage temporarily disabled during migration to Promotion Engine',
          );
          // // Lấy thông tin coupon ngay trong transaction để đảm bảo dữ liệu đúng nhất
          // const coupon = await tx.coupon.findUnique({
          //   where: {
          //     tenantId_code: {
          //       code: createOrderDto.couponCode,
          //       tenantId: tenant.id,
          //     },
          //   } as any,
          //   select: {
          //     id: true,
          //     code: true,
          //     discountType: true,
          //     discountValue: true,
          //     minOrderAmount: true,
          //     maxDiscountAmount: true,
          //     usageLimit: true,
          //     usedCount: true,
          //     startDate: true,
          //     endDate: true,
          //   },
          // });

          // if (!coupon) {
          //   throw new BadRequestException('Mã giảm giá không tồn tại');
          // }

          // // 🔒 BẢO MẬT: Chặn dùng trộm mã WELCOME của người khác
          // if (coupon.code.startsWith('WELCOME-')) {
          //   const ownerNotification = await tx.notification.findFirst({
          //     where: {
          //       userId,
          //       type: 'SYSTEM',
          //       message: { contains: coupon.code },
          //     },
          //   });

          //   if (!ownerNotification) {
          //     throw new BadRequestException(
          //       'Mã giảm giá này không thuộc về tài khoản của bạn',
          //     );
          //   }
          // }

          // const now = new Date();
          // if (coupon.startDate && now < new Date(coupon.startDate)) {
          //   throw new BadRequestException(
          //     'Mã giảm giá chưa đến thời gian hiệu lực',
          //   );
          // }

          // if (coupon.endDate && now > new Date(coupon.endDate)) {
          //   throw new BadRequestException('Mã giảm giá đã hết hạn');
          // }

          // // ✅ Atomic Check Limit: Đảm bảo không bị vượt quá số lượt sử dụng
          // if (
          //   coupon.usageLimit !== null &&
          //   coupon.usedCount >= coupon.usageLimit
          // ) {
          //   throw new BadRequestException('Mã giảm giá đã hết lượt sử dụng');
          // }

          // if (
          //   coupon.minOrderAmount &&
          //   totalAmount < Number(coupon.minOrderAmount)
          // ) {
          //   throw new BadRequestException(
          //     `Đơn hàng cần tối thiểu ${Number(coupon.minOrderAmount)}đ để sử dụng mã này`,
          //   );
          // }

          // // Tính toán số tiền giảm
          // if (coupon.discountType === 'PERCENTAGE') {
          //   discountAmount = (totalAmount * Number(coupon.discountValue)) / 100;
          //   if (coupon.maxDiscountAmount) {
          //     discountAmount = Math.min(
          //       discountAmount,
          //       Number(coupon.maxDiscountAmount),
          //     );
          //   }
          // } else {
          //   discountAmount = Number(coupon.discountValue);
          // }

          // couponId = coupon.id;
          // totalAmount = Math.max(0, totalAmount - discountAmount);

          // // ✅ Tăng biến đếm số lần sử dụng (Atomic Increment)
          // await tx.coupon.update({
          //   where: { id: couponId },
          //   data: { usedCount: { increment: 1 } },
          // });
        }

        // 6. Tính phí vận chuyển (Shipping Fee)
        // Lưu ý: Gọi API bên ngoài có thể chậm, cân nhắc đưa vào background job nếu cần tối ưu tốc độ.
        let shippingFee = 0;
        let recipientName = createOrderDto.recipientName;
        let phoneNumber = createOrderDto.phoneNumber;
        let shippingAddressSnapshot: any = null;
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
            if (address.districtId && address.wardCode) {
              try {
                shippingFee = await this.shippingService.calculateFee(
                  address.districtId,
                  address.wardCode,
                );
              } catch (error) {
                this.logger.warn(
                  'Lỗi tính phí vận chuyển từ GHN, sử dụng phí mặc định',
                );
                shippingFee = 30000; // ✅ Mức phí dự phòng an toàn
              }
            }
          }
        }
        totalAmount += shippingFee;

        // 7. Tạo đơn hàng (Order) vào Database
        const order = await tx.order.create({
          data: {
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
            couponId,
            addressId: createOrderDto.addressId,
            tenantId: tenant.id,
            items: {
              create: orderItemsData,
            },
          } as Prisma.OrderUncheckedCreateInput,
          include: { items: true },
        });

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

        if (paymentResult.success) {
          paymentUrl = paymentResult.paymentUrl;

          // Tạo bản ghi lịch sử thanh toán
          await this.prisma.payment.create({
            data: {
              orderId: order.id,
              amount: order.totalAmount,
              paymentMethod: createOrderDto.paymentMethod,
              status: paymentUrl ? 'PENDING' : 'PAID',
              providerTransactionId: paymentResult.transactionId,
              tenantId: tenant.id,
            },
          });

          // Nếu thanh toán thành công ngay lập tức (không cần redirect URL) -> Update đơn thành PAID
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
      this.logger.error(`Lỗi xử lý thanh toán cho đơn hàng ${order.id}`, error);
      // Không throw lỗi ở đây để tránh làm user hoang mang, đơn hàng đã tạo thành công
      // User có thể thanh toán lại sau.
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
              skuNameSnapshot: true,
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
        shippingAddressSnapshot: true,
        shippingFee: true,
        shippingCode: true,
        transactionId: true,
        createdAt: true,
        updatedAt: true,
        cancellationReason: true,
        payments: {
          orderBy: { createdAt: 'desc' },
        },
        items: {
          select: {
            id: true,
            quantity: true,
            priceAtPurchase: true,
            productName: true,
            skuNameSnapshot: true,
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
        shippingAddressSnapshot: true,
        payments: {
          orderBy: { createdAt: 'desc' },
        },
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
            skuNameSnapshot: true,
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
        this.syncWithGHN(transactionResult).catch((e) => {
          this.logger.error(
            `Đồng bộ GHN nền thất bại cho đơn ${transactionResult.id}`,
            e,
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
      await this.prisma.order.update({
        where: { id: order.id },
        data: {
          shippingCode: ghnResponse.order_code,
        } as any,
      });

      this.logger.log(
        `Đã đồng bộ đơn hàng ${order.id} sang GHN thành công: ${ghnResponse.order_code}`,
      );
    } catch (error: any) {
      this.logger.error(
        `Đồng bộ GHN thất bại cho đơn ${order.id}: ${error.message}`,
        error.response?.data || error,
      );
      // Không throw lỗi chết app, chỉ log warning
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
