import {
  Injectable,
  Inject,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { CommandUseCase } from '@/core/application/use-case.interface';
import { Result } from '@/core/application/result';
import {
  BusinessRuleViolationError,
  EntityNotFoundError,
} from '@/core/domain/errors/domain.error';
import { PrismaService } from '@core/prisma/prisma.service';
import {
  IOrderRepository,
  ORDER_REPOSITORY,
} from '../../../domain/repositories/order.repository.interface';
import {
  ICartRepository,
  CART_REPOSITORY,
} from '../../../domain/repositories/cart.repository.interface';
import {
  ISkuRepository,
  SKU_REPOSITORY,
} from '@/catalog/domain/repositories/sku.repository.interface';
import {
  Order,
  OrderStatus,
  OrderItem,
  ShippingAddressSnapshot,
} from '../../../domain/entities/order.entity';
import { Money } from '@core/domain/value-objects/money.vo';
import { PromotionsService } from '@/marketing/promotions/promotions.service';
import { ShippingService } from '@/sales/shipping/shipping.service';
import { PaymentService } from '@/sales/payment/payment.service';
import { InventoryService } from '@/catalog/skus/inventory.service';
import { v4 as uuidv4 } from 'uuid';

export interface CreateOrderInput {
  userId: string;
  tenantId: string;
  recipientName: string;
  phoneNumber: string;
  shippingAddress: string;
  paymentMethod?: string;
  shippingCity?: string;
  shippingDistrict?: string;
  shippingWard?: string;
  shippingPhone?: string;
  itemIds?: string[];
  couponCode?: string;
  returnUrl?: string;
  addressId?: string;
}

export type CreateOrderOutput = {
  order: Order;
  paymentUrl?: string;
};

@Injectable()
export class CreateOrderUseCase extends CommandUseCase<
  CreateOrderInput,
  CreateOrderOutput
> {
  private readonly logger = new Logger(CreateOrderUseCase.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: IOrderRepository,
    @Inject(CART_REPOSITORY)
    private readonly cartRepository: ICartRepository,
    @Inject(SKU_REPOSITORY)
    private readonly skuRepository: ISkuRepository,
    private readonly promotionsService: PromotionsService,
    private readonly shippingService: ShippingService,
    private readonly paymentService: PaymentService,
    private readonly inventoryService: InventoryService,
  ) {
    super();
  }

  async execute(
    input: CreateOrderInput,
  ): Promise<Result<CreateOrderOutput, any>> {
    const { userId, tenantId } = input;

    try {
      // 1. Lấy giỏ hàng
      const cart = await this.cartRepository.findByCustomer(userId);
      if (!cart || cart.items.length === 0) {
        return Result.fail(new BadRequestException('Giỏ hàng trống'));
      }

      // 2. Lọc sản phẩm cần thanh toán
      const itemsToProcess =
        input.itemIds && input.itemIds.length > 0
          ? cart.items.filter((item) => input.itemIds!.includes(item.id))
          : cart.items;

      if (itemsToProcess.length === 0) {
        return Result.fail(
          new BadRequestException('Chưa chọn sản phẩm nào để thanh toán'),
        );
      }

      // 3. Lấy thông tin SKU và validate
      const skuIds = itemsToProcess.map((i) => i.skuId);
      const skus = await this.skuRepository.findByIds(skuIds);
      const skuMap = new Map(skus.map((s) => [s.id, s]));

      const domainOrderItems: OrderItem[] = [];
      let subtotalAmount = 0;

      for (const cartItem of itemsToProcess) {
        const sku = skuMap.get(cartItem.skuId);
        if (!sku) {
          return Result.fail(
            new BadRequestException(`Sản phẩm ${cartItem.skuId} không tồn tại`),
          );
        }

        if (sku.status !== 'ACTIVE') {
          return Result.fail(
            new BadRequestException(
              `Sản phẩm ${sku.skuCode} hiện đang ngừng kinh doanh`,
            ),
          );
        }

        if (sku.stock < cartItem.quantity) {
          return Result.fail(
            new BadRequestException(
              `Sản phẩm ${sku.skuCode} không đủ số lượng`,
            ),
          );
        }

        const unitPrice = sku.price.amount;
        const itemSubtotal = unitPrice * cartItem.quantity;
        subtotalAmount += itemSubtotal;

        domainOrderItems.push({
          id: uuidv4(),
          skuId: sku.id,
          productNameSnapshot: sku.productName || '', // Cần field này từ entity hoặc load thêm
          skuCodeSnapshot: sku.skuCode,
          variantLabelSnapshot: sku.variantLabel || '',
          priceAtPurchase: sku.price,
          imageUrlSnapshot: sku.imageUrl,
          quantity: cartItem.quantity,
          subtotal: Money.create(itemSubtotal),
        });
      }

      // 4. Khuyến mãi
      let discountAmount = 0;
      let appliedPromotionId: string | undefined;

      if (input.couponCode) {
        const promoResult = await this.promotionsService.validatePromotion({
          code: input.couponCode,
          totalAmount: subtotalAmount,
          userId,
          items: itemsToProcess.map((i) => ({
            skuId: i.skuId,
            quantity: i.quantity,
            price: skuMap.get(i.skuId)!.price.amount,
          })),
        });

        if (promoResult.valid) {
          appliedPromotionId = promoResult.promotionId;
          discountAmount = promoResult.discountAmount;
        }
      }

      // 5. Phí vận chuyển & Email khách hàng
      const [user, address] = await Promise.all([
        this.prisma.user.findUnique({
          where: { id: userId },
          select: { email: true },
        }),
        input.addressId
          ? this.prisma.address.findUnique({
              where: { id: input.addressId },
            })
          : null,
      ]);

      if (!user) {
        return Result.fail(new EntityNotFoundError('User', userId));
      }

      let shippingFee = 0;
      let shippingAddress: ShippingAddressSnapshot = {
        fullName: input.recipientName,
        phone: input.phoneNumber,
        addressLine1: input.shippingAddress,
        city: input.shippingCity || '',
        district: input.shippingDistrict,
        ward: input.shippingWard,
        country: 'VN',
      };

      // Calculate shipping fee if address is found
      if (address) {
        shippingAddress = {
          fullName: address.recipientName,
          phone: address.phoneNumber,
          addressLine1: address.street,
          city: address.city,
          district: address.district,
          ward: address.ward || undefined,
          country: address.country || 'VN',
        };

        if (address.districtId && address.wardCode) {
          try {
            shippingFee = await this.shippingService.calculateFee(
              address.districtId,
              address.wardCode,
            );
          } catch (e) {
            this.logger.warn(`Failed to calculate shipping fee: ${e.message}`);
            // Fallback to default fee or 0
          }
        }
      }

      // 6. Tạo Order Entity
      const orderNumber =
        await this.orderRepository.generateOrderNumber(tenantId);
      const order = Order.create({
        id: uuidv4(),
        tenantId,
        orderNumber,
        customerId: userId,
        customerEmail: user.email,
        items: domainOrderItems,
        shippingAddress,
        paymentMethod: input.paymentMethod || 'COD',
        shippingCost: Money.create(shippingFee),
        couponCode: input.couponCode,
        couponDiscount: Money.create(discountAmount),
      });

      // 7. Lưu vào DB trong Transaction
      await this.prisma.$transaction(
        async (tx) => {
          // Lưu Order (Sử dụng repository với tx)
          // Lưu ý: Repository hiện tại chưa nhận tx, nhưng ta có thể dùng raw prisma cho phần này
          // hoặc nâng cấp repository sau. Để an toàn, ta dùng repo.save nếu nó support tx,
          // hoặc dùng prisma trực tiếp thông qua repo method (nếu Repo được thiết kế tốt).

          // Tạm thời dùng prisma thông qua repo save (Repo này cần support tx)
          await this.orderRepository.save(order);

          // Trừ kho
          for (const item of itemsToProcess) {
            await this.inventoryService.reserveStock(
              item.skuId,
              item.quantity,
              tx,
            );
          }

          // Cập nhật khuyến mãi
          if (appliedPromotionId) {
            await (tx as any).promotion.update({
              where: { id: appliedPromotionId },
              data: { usedCount: { increment: 1 } },
            });
          }

          // Xóa giỏ hàng
          const itemIdsToDelete = itemsToProcess.map((i) => i.id);
          await tx.cartItem.deleteMany({
            where: { id: { in: itemIdsToDelete } },
          });

          // Outbox events
          await tx.outboxEvent.create({
            data: {
              aggregateType: 'ORDER',
              aggregateId: order.id,
              type: 'ORDER_CREATED',
              payload: { orderId: order.id },
              tenantId: input.tenantId, // Ensure tenant isolation
            },
          });
        },
        {
          isolationLevel: 'Serializable',
          timeout: 10000,
        },
      );

      // 8. Xử lý thanh toán Online
      let paymentUrl: string | undefined;
      if (input.paymentMethod && input.paymentMethod !== 'COD') {
        const paymentResult = await this.paymentService.processPayment(
          input.paymentMethod,
          {
            amount: order.total.amount,
            orderId: order.id,
            returnUrl: input.returnUrl,
          },
        );
        if (paymentResult.success) {
          paymentUrl = paymentResult.paymentUrl;
        }
      }

      return Result.ok({ order, paymentUrl });
    } catch (error) {
      this.logger.error('Error creating order', error);
      return Result.fail(error);
    }
  }
}
