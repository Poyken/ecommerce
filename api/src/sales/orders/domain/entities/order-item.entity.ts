import { BaseEntity, EntityProps } from '@core/domain/entities/base.entity';

export interface OrderItemProps extends EntityProps {
  orderId: string;
  skuId: string;
  productId: string;
  skuNameSnapshot: string;
  productNameSnapshot: string;
  priceAtPurchase: number;
  quantity: number;
  discountAmount: number;
  finalPrice: number; // (priceAtPurchase * quantity) - discountAmount
}

export class OrderItem extends BaseEntity<OrderItemProps> {
  private constructor(props: OrderItemProps) {
    super(props);
  }

  static create(props: {
    id: string;
    orderId: string;
    skuId: string;
    productId: string;
    skuNameSnapshot: string;
    productNameSnapshot: string;
    priceAtPurchase: number;
    quantity: number;
    discountAmount?: number;
  }): OrderItem {
    const discount = props.discountAmount ?? 0;
    const finalPrice = props.priceAtPurchase * props.quantity - discount;

    return new OrderItem({
      ...props,
      discountAmount: discount,
      finalPrice: finalPrice > 0 ? finalPrice : 0,
    });
  }

  static fromPersistence(props: OrderItemProps): OrderItem {
    return new OrderItem(props);
  }

  get finalPrice(): number {
    return this.props.finalPrice;
  }

  get skuId(): string {
    return this.props.skuId;
  }

  get quantity(): number {
    return this.props.quantity;
  }

  toPersistence(): Record<string, unknown> {
    return {
      ...this.props,
      id: this.id,
    };
  }
}
