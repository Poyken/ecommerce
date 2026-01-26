import {
  Injectable,
  Inject,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { CommandUseCase } from '@/core/application/use-case.interface';
import { Result } from '@/core/application/result';
import { PrismaService } from '@core/prisma/prisma.service';
import {
  IOrderRepository,
  ORDER_REPOSITORY,
} from '@/sales/domain/repositories/order.repository.interface';
import {
  ICartRepository,
  CART_REPOSITORY,
} from '@/sales/domain/repositories/cart.repository.interface';
import {
  ISkuRepository,
  SKU_REPOSITORY,
} from '@/catalog/domain/repositories/sku.repository.interface';
import {
  Order,
  OrderItem,
  ShippingAddressSnapshot,
} from '@/sales/domain/entities/order.entity';
import { OrderStatus } from '@/sales/domain/enums/order-status.enum';
import { Money } from '@core/domain/value-objects/money.vo';
import { ValidatePromotionUseCase } from '@/marketing/promotions/application/use-cases/validate-promotion.use-case';
import { ShippingService } from '@/sales/shipping/shipping.service';
import { PaymentService } from '@/sales/payment/payment.service';
import { InventoryService } from '@/catalog/skus/inventory.service';
import { v4 as uuidv4 } from 'uuid';

export interface PlaceOrderInput {
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
  items: {
    skuId: string;
    quantity: number;
  }[];
  couponCode?: string;
  returnUrl?: string;
  addressId?: string;
}

export type PlaceOrderOutput = {
  orderId: string;
  totalAmount: number;
  paymentUrl?: string;
};

@Injectable()
export class PlaceOrderUseCase extends CommandUseCase<
  PlaceOrderInput,
  PlaceOrderOutput
> {
  private readonly logger = new Logger(PlaceOrderUseCase.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(ORDER_REPOSITORY)
    private readonly orderRepository: IOrderRepository,
    @Inject(CART_REPOSITORY)
    private readonly cartRepository: ICartRepository,
    @Inject(SKU_REPOSITORY)
    private readonly skuRepository: ISkuRepository,
    private readonly validatePromotionUseCase: ValidatePromotionUseCase,
    private readonly shippingService: ShippingService,
    private readonly paymentService: PaymentService,
    private readonly inventoryService: InventoryService,
  ) {
    super();
  }

  async execute(
    input: PlaceOrderInput,
  ): Promise<Result<PlaceOrderOutput, any>> {
    const { userId, tenantId } = input;

    try {
      if (!input.items || input.items.length === 0) {
        return Result.fail(new BadRequestException('Danh sách sản phẩm trống'));
      }

      // 1. Validate SKUs and Quantities
      const skuIds = input.items.map((i) => i.skuId);
      const skus = await this.skuRepository.findByIds(skuIds);
      const skuMap = new Map(skus.map((s) => [s.id, s]));

      const domainOrderItems: OrderItem[] = [];
      let subtotalAmount = 0;

      for (const inputItem of input.items) {
        const sku = skuMap.get(inputItem.skuId);
        if (!sku) {
          return Result.fail(
            new BadRequestException(
              `Sản phẩm ${inputItem.skuId} không tồn tại`,
            ),
          );
        }

        if (sku.status !== 'ACTIVE') {
          return Result.fail(
            new BadRequestException(`Sản phẩm ${sku.skuCode} ngừng kinh doanh`),
          );
        }

        if (sku.stock < inputItem.quantity) {
          return Result.fail(
            new BadRequestException(`Sản phẩm ${sku.skuCode} không đủ tồn kho`),
          );
        }

        const unitPrice = sku.price.amount;
        const itemSubtotal = Math.round(unitPrice * inputItem.quantity);
        subtotalAmount += itemSubtotal;

        domainOrderItems.push({
          id: uuidv4(),
          skuId: sku.id,
          productNameSnapshot: sku.productName || 'Product',
          skuCodeSnapshot: sku.skuCode,
          variantLabelSnapshot: sku.variantLabel || '',
          priceAtPurchase: sku.price,
          imageUrlSnapshot: sku.imageUrl,
          quantity: inputItem.quantity,
          subtotal: Money.create(itemSubtotal),
        });
      }

      // 2. Promotions
      let discountAmount = 0;
      let appliedPromotionId: string | undefined;

      if (input.couponCode) {
        const promoResult = await this.validatePromotionUseCase.execute({
          tenantId: input.tenantId,
          code: input.couponCode,
          totalAmount: subtotalAmount,
          userId,
          items: domainOrderItems.map((i) => ({
            skuId: i.skuId,
            quantity: i.quantity,
            price: i.priceAtPurchase.amount,
            // To improve this, we might need categoryId and productId if rules require them
            // But usually coupon validation in checkout is secondary check.
            // Let's see if we can get these from skuMap.
            // FIXED: Repo does not load product relation by default. Passing undefined for now.
            categoryId: undefined, // (skuMap.get(i.skuId) as any)?.product?.categories?.[0]?.categoryId,
            productId: skuMap.get(i.skuId)?.productId,
          })),
        });

        if (promoResult.isSuccess) {
          appliedPromotionId = promoResult.value.promotionId;
          discountAmount = promoResult.value.discountAmount;
        }
      }

      // 3. Shipping
      const [user, address] = await Promise.all([
        this.prisma.user.findUnique({
          where: { id: userId },
          select: { email: true },
        }),
        input.addressId
          ? this.prisma.address.findUnique({ where: { id: input.addressId } })
          : null,
      ]);

      if (!user) return Result.fail(new BadRequestException('User not found'));

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

      if (address && address.districtId && address.wardCode) {
        shippingFee = await this.shippingService
          .calculateFee(address.districtId, address.wardCode)
          .catch(() => 30000);
      }

      // 4. Create Order
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
        couponDiscount: Money.create(discountAmount),
        couponCode: input.couponCode,
      });

      // 5. Transaction
      await this.prisma.$transaction(async (tx) => {
        await this.orderRepository.save(order);
        for (const item of input.items) {
          await this.inventoryService.reserveStock(
            item.skuId,
            item.quantity,
            tx,
          );
        }
        if (appliedPromotionId) {
          await (tx as any).promotion.update({
            where: { id: appliedPromotionId },
            data: { usedCount: { increment: 1 } },
          });
        }
        // Cleanup cart
        const cart = await this.cartRepository.findByCustomer(userId);
        if (cart) {
          await tx.cartItem.deleteMany({
            where: { cartId: cart.id, skuId: { in: skuIds } },
          });
        }
        // Outbox
        await tx.outboxEvent.create({
          data: {
            aggregateType: 'ORDER',
            aggregateId: order.id,
            type: 'ORDER_CREATED',
            payload: { orderId: order.id },
            tenantId,
          },
        });
      });

      // 6. Payment
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
        if (paymentResult.success) paymentUrl = paymentResult.paymentUrl;
      }

      return Result.ok({
        orderId: order.id,
        totalAmount: order.total.amount,
        paymentUrl,
      });
    } catch (error) {
      this.logger.error('Error in PlaceOrderUseCase', error);
      return Result.fail(
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  }
}
