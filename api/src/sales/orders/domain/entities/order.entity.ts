import { AggregateRoot, EntityProps } from '@core/domain/entities/base.entity';
import { BusinessRuleViolationError } from '@core/domain/errors/domain.error';
import { OrderStatus, PaymentStatus } from '../enums/order-status.enum';
import { OrderItem } from './order-item.entity';

export interface OrderProps extends EntityProps {
  tenantId: string;
  userId: string;
  status: OrderStatus;
  totalAmount: number;
  shippingFee: number;
  recipientName: string;
  phoneNumber: string;
  shippingAddress: string;
  paymentMethod?: string;
  paymentStatus: PaymentStatus;
  items: OrderItem[];
  orderDate: Date;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export class Order extends AggregateRoot<OrderProps> {
  private constructor(props: OrderProps) {
    super(props);
  }

  static create(props: {
    id: string;
    tenantId: string;
    userId: string;
    items: OrderItem[];
    shippingFee: number;
    recipientName: string;
    phoneNumber: string;
    shippingAddress: string;
    paymentMethod?: string;
  }): Order {
    const itemsTotal = props.items.reduce(
      (sum, item) => sum + item.finalPrice,
      0,
    );
    const totalAmount = itemsTotal + props.shippingFee;

    return new Order({
      ...props,
      status: OrderStatus.PENDING,
      paymentStatus: PaymentStatus.UNPAID,
      totalAmount,
      orderDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  static fromPersistence(props: OrderProps): Order {
    return new Order(props);
  }

  // State Machine Logic
  canTransitionTo(newStatus: OrderStatus): boolean {
    const current = this.props.status;

    // Same status
    if (current === newStatus) return true;

    switch (current) {
      case OrderStatus.PENDING:
        return [OrderStatus.CONFIRMED, OrderStatus.CANCELLED].includes(
          newStatus,
        );
      case OrderStatus.CONFIRMED:
        return [OrderStatus.PROCESSING, OrderStatus.CANCELLED].includes(
          newStatus,
        ); // Admin can cancel manually
      case OrderStatus.PROCESSING:
        return [OrderStatus.SHIPPED, OrderStatus.CANCELLED].includes(newStatus);
      case OrderStatus.SHIPPED:
        return [OrderStatus.DELIVERED, OrderStatus.RETURNED].includes(
          newStatus,
        );
      case OrderStatus.DELIVERED:
        return [OrderStatus.RETURNED].includes(newStatus); // Return policy
      case OrderStatus.CANCELLED:
      case OrderStatus.RETURNED:
        return false; // End states
      default:
        return false;
    }
  }

  changeStatus(newStatus: OrderStatus): void {
    if (!this.canTransitionTo(newStatus)) {
      throw new BusinessRuleViolationError(
        `Invalid status transition from ${this.props.status} to ${newStatus}`,
      );
    }
    this.props.status = newStatus;
    this.props.updatedAt = new Date();
    this.touch();
  }

  markAsPaid(): void {
    if (this.props.paymentStatus === PaymentStatus.PAID) return;
    this.props.paymentStatus = PaymentStatus.PAID;
    this.touch();
  }

  cancel(reason?: string): void {
    this.changeStatus(OrderStatus.CANCELLED);
    // Logic to release inventory would be triggered by Domain Event
  }

  get totalAmount(): number {
    return this.props.totalAmount;
  }

  get items(): OrderItem[] {
    return [...this.props.items];
  }

  get tenantId(): string {
    return this.props.tenantId;
  }

  get userId(): string {
    return this.props.userId;
  }

  get status(): OrderStatus {
    return this.props.status;
  }

  toPersistence(): Record<string, unknown> {
    return {
      ...this.props,
      id: this.id, // Explicit ID from getter, overrides props.id if needed
      items: this.props.items.map((item) => item.toPersistence()),
    };
  }
}
