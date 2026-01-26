/**
 * =====================================================================
 * ORDER ENTITY - Domain Layer (Aggregate Root)
 * =====================================================================
 *
 * Clean Architecture: Domain Layer
 *
 * Order is an Aggregate Root that represents a customer purchase.
 * It contains snapshots of product/price data at the time of order
 * (following coding-standards.md: Historical Snapshots rule).
 *
 * Business Rules:
 * 1. Order total must match sum of line items
 * 2. Order status transitions must follow valid paths
 * 3. Cannot modify completed/cancelled orders
 * 4. Price snapshots are immutable after creation
 */

import {
  AggregateRoot,
  BaseDomainEvent,
  EntityProps,
} from '@core/domain/entities/base.entity';
import { Money } from '@core/domain/value-objects/money.vo';
import {
  InvalidEntityStateError,
  BusinessRuleViolationError,
} from '@core/domain/errors/domain.error';
import { OrderStatus, PaymentStatus } from '../enums/order-status.enum';
export { OrderStatus, PaymentStatus };

// Valid status transitions
const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING]: [OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
  [OrderStatus.CONFIRMED]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
  [OrderStatus.PROCESSING]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
  [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED, OrderStatus.RETURNED],
  [OrderStatus.DELIVERED]: [OrderStatus.RETURNED],
  [OrderStatus.CANCELLED]: [],
  [OrderStatus.RETURNED]: [],
  [OrderStatus.REFUNDED]: [],
};

// =====================================================================
// DOMAIN EVENTS
// =====================================================================

export class OrderCreatedEvent extends BaseDomainEvent {
  constructor(
    readonly orderId: string,
    readonly tenantId: string,
    readonly customerId: string,
    readonly total: number,
  ) {
    super('OrderCreated', orderId);
  }
}

export class OrderConfirmedEvent extends BaseDomainEvent {
  constructor(
    readonly orderId: string,
    readonly paymentId: string,
  ) {
    super('OrderConfirmed', orderId);
  }
}

export class OrderShippedEvent extends BaseDomainEvent {
  constructor(
    readonly orderId: string,
    readonly trackingNumber: string,
    readonly carrier: string,
  ) {
    super('OrderShipped', orderId);
  }
}

export class OrderDeliveredEvent extends BaseDomainEvent {
  constructor(readonly orderId: string) {
    super('OrderDelivered', orderId);
  }
}

export class OrderCancelledEvent extends BaseDomainEvent {
  constructor(
    readonly orderId: string,
    readonly reason: string,
  ) {
    super('OrderCancelled', orderId);
  }
}

// =====================================================================
// VALUE OBJECTS (Order-specific)
// =====================================================================

/**
 * Order line item with SNAPSHOT data
 * (prices captured at order time, not referenced from current product)
 */
export interface OrderItem {
  readonly id: string;
  readonly skuId: string;

  // SNAPSHOTS - immutable copies from time of order
  readonly productNameSnapshot: string;
  readonly skuCodeSnapshot: string;
  readonly variantLabelSnapshot: string; // e.g., "Red / XL"
  readonly priceAtPurchase: Money; // Unit price at order time
  readonly imageUrlSnapshot?: string;

  readonly quantity: number;
  readonly subtotal: Money; // quantity * priceAtPurchase
}

/**
 * Shipping address snapshot
 */
export interface ShippingAddressSnapshot {
  readonly fullName: string;
  readonly phone: string;
  readonly addressLine1: string;
  readonly addressLine2?: string;
  readonly city: string;
  readonly district?: string;
  readonly ward?: string;
  readonly postalCode?: string;
  readonly country: string;
}

/**
 * Payment information
 */
export interface PaymentInfo {
  readonly paymentId?: string;
  readonly method: string;
  readonly status: PaymentStatus;
  readonly paidAt?: Date;
  readonly transactionId?: string;
}

/**
 * Shipping information
 */
export interface ShippingInfo {
  readonly carrier?: string;
  readonly trackingNumber?: string;
  readonly shippingCode?: string; // GHN/GHTK code
  readonly ghnStatus?: string;
  readonly shippedAt?: Date;
  readonly deliveredAt?: Date;
  readonly shippingCost: Money;
}

// =====================================================================
// ENTITY PROPS
// =====================================================================

export interface OrderProps extends EntityProps {
  tenantId: string;
  orderNumber: string;
  customerId: string;
  customerEmail: string;

  // Status
  status: OrderStatus;

  // Items (with snapshots)
  items: OrderItem[];

  // Totals
  subtotal: Money; // Sum of item subtotals
  discount: Money; // Applied discounts
  shippingCost: Money; // Shipping fee
  tax: Money; // Tax amount
  total: Money; // Final total

  // Discount info
  couponCode?: string;
  couponDiscount?: Money;

  // Addresses
  shippingAddress: ShippingAddressSnapshot;
  billingAddress?: ShippingAddressSnapshot;

  // Payment
  payment: PaymentInfo;

  // Shipping
  shipping: ShippingInfo;

  // Notes
  customerNote?: string;
  internalNote?: string;

  // Timestamps
  confirmedAt?: Date;
  cancelledAt?: Date;
  cancelReason?: string;
}

// =====================================================================
// AGGREGATE ROOT
// =====================================================================

export class Order extends AggregateRoot<OrderProps> {
  private constructor(props: OrderProps) {
    super(props);
  }

  // =====================================================================
  // FACTORY METHODS
  // =====================================================================

  /**
   * Create a new Order
   */
  static create(props: {
    id: string;
    tenantId: string;
    orderNumber: string;
    customerId: string;
    customerEmail: string;
    items: OrderItem[];
    shippingAddress: ShippingAddressSnapshot;
    billingAddress?: ShippingAddressSnapshot;
    paymentMethod: string;
    shippingCost: Money;
    couponCode?: string;
    couponDiscount?: Money;
    customerNote?: string;
  }): Order {
    // Calculate totals
    const subtotal = props.items.reduce(
      (sum, item) => sum.add(item.subtotal),
      Money.zero(),
    );

    const discount = props.couponDiscount ?? Money.zero();
    const tax = Money.zero(); // TODO: Calculate tax
    const total = subtotal.add(props.shippingCost).subtract(discount).add(tax);

    const order = new Order({
      id: props.id,
      tenantId: props.tenantId,
      orderNumber: props.orderNumber,
      customerId: props.customerId,
      customerEmail: props.customerEmail,
      status: OrderStatus.PENDING,
      items: props.items,
      subtotal,
      discount,
      shippingCost: props.shippingCost,
      tax,
      total,
      couponCode: props.couponCode,
      couponDiscount: props.couponDiscount,
      shippingAddress: props.shippingAddress,
      billingAddress: props.billingAddress,
      payment: {
        method: props.paymentMethod,
        status: PaymentStatus.PENDING,
      },
      shipping: {
        shippingCost: props.shippingCost,
      },
      customerNote: props.customerNote,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    order.addDomainEvent(
      new OrderCreatedEvent(
        order.id,
        order.tenantId,
        order.customerId,
        order.total.amount,
      ),
    );

    return order;
  }

  /**
   * Reconstitute from persistence
   */
  static fromPersistence(props: OrderProps): Order {
    return new Order(props);
  }

  // =====================================================================
  // GETTERS
  // =====================================================================

  get tenantId(): string {
    return this.props.tenantId;
  }

  get orderNumber(): string {
    return this.props.orderNumber;
  }

  get customerId(): string {
    return this.props.customerId;
  }

  get userId(): string {
    return this.props.customerId;
  }

  get customerEmail(): string {
    return this.props.customerEmail;
  }

  get status(): OrderStatus {
    return this.props.status;
  }

  get items(): readonly OrderItem[] {
    return Object.freeze([...this.props.items]);
  }

  get subtotal(): Money {
    return this.props.subtotal;
  }

  get discount(): Money {
    return this.props.discount;
  }

  get shippingCost(): Money {
    return this.props.shippingCost;
  }

  get tax(): Money {
    return this.props.tax;
  }

  get total(): Money {
    return this.props.total;
  }

  get shippingAddress(): ShippingAddressSnapshot {
    return this.props.shippingAddress;
  }

  get payment(): PaymentInfo {
    return this.props.payment;
  }

  get shipping(): ShippingInfo {
    return this.props.shipping;
  }

  get shippingCode(): string | undefined {
    return this.props.shipping.shippingCode;
  }

  get paymentMethod(): string {
    return this.props.payment.method;
  }

  get paymentStatus(): PaymentStatus {
    return this.props.payment.status;
  }

  get billingAddress(): ShippingAddressSnapshot | undefined {
    return this.props.billingAddress;
  }

  get couponCode(): string | undefined {
    return this.props.couponCode;
  }

  get customerNote(): string | undefined {
    return this.props.customerNote;
  }

  get internalNote(): string | undefined {
    return this.props.internalNote;
  }

  get confirmedAt(): Date | undefined {
    return this.props.confirmedAt;
  }

  get cancelledAt(): Date | undefined {
    return this.props.cancelledAt;
  }

  get cancelReason(): string | undefined {
    return this.props.cancelReason;
  }

  get isPending(): boolean {
    return this.props.status === OrderStatus.PENDING;
  }

  get isConfirmed(): boolean {
    return this.props.status === OrderStatus.CONFIRMED;
  }

  get isCancelled(): boolean {
    return this.props.status === OrderStatus.CANCELLED;
  }

  get isCompleted(): boolean {
    return this.props.status === OrderStatus.DELIVERED;
  }

  get canBeCancelled(): boolean {
    return [
      OrderStatus.PENDING,
      OrderStatus.CONFIRMED,
      OrderStatus.PROCESSING,
    ].includes(this.props.status);
  }

  /**
   * Validate state machine transition logic
   */
  canTransitionTo(newStatus: OrderStatus): boolean {
    const validTransitions = VALID_TRANSITIONS[this.props.status];
    return validTransitions ? validTransitions.includes(newStatus) : false;
  }

  // =====================================================================
  // BUSINESS METHODS
  // =====================================================================

  /**
   * Confirm order after payment
   */
  confirm(paymentId: string, transactionId?: string): void {
    if (!this.canTransitionTo(OrderStatus.CONFIRMED)) {
      throw new BusinessRuleViolationError(
        `Invalid status transition from ${this.props.status} to ${OrderStatus.CONFIRMED}`,
      );
    }

    this.props.status = OrderStatus.CONFIRMED;
    this.props.payment = {
      ...this.props.payment,
      paymentId,
      status: PaymentStatus.PAID,
      paidAt: new Date(),
      transactionId,
    };
    this.props.confirmedAt = new Date();
    this.touch();

    this.addDomainEvent(new OrderConfirmedEvent(this.id, paymentId));
  }

  /**
   * Mark as paid
   */
  markAsPaid(): void {
    if (this.props.payment.status === PaymentStatus.PAID) return;
    this.props.payment = {
      ...this.props.payment,
      status: PaymentStatus.PAID,
      paidAt: new Date(),
    };
    this.touch();
  }

  /**
   * Start processing the order
   */
  startProcessing(): void {
    if (!this.canTransitionTo(OrderStatus.PROCESSING)) {
      throw new BusinessRuleViolationError(
        `Invalid status transition from ${this.props.status} to ${OrderStatus.PROCESSING}`,
      );
    }
    this.props.status = OrderStatus.PROCESSING;
    this.touch();
  }

  /**
   * Ship the order
   */
  ship(trackingNumber: string, carrier: string): void {
    this.assertCanTransitionTo(OrderStatus.SHIPPED);

    this.props.status = OrderStatus.SHIPPED;
    this.props.shipping = {
      ...this.props.shipping,
      trackingNumber,
      carrier,
      shippedAt: new Date(),
    };
    this.touch();

    this.addDomainEvent(
      new OrderShippedEvent(this.id, trackingNumber, carrier),
    );
  }

  /**
   * Mark as delivered
   */
  /**
   * Mark as delivered
   */
  markAsDelivered(): void {
    this.assertCanTransitionTo(OrderStatus.DELIVERED);

    this.props.status = OrderStatus.DELIVERED;
    this.props.shipping = {
      ...this.props.shipping,
      deliveredAt: new Date(),
    };
    this.touch();

    this.addDomainEvent(new OrderDeliveredEvent(this.id));
  }

  /**
   * Cancel the order
   */
  cancel(reason: string): void {
    if (!this.canBeCancelled) {
      throw new InvalidEntityStateError('Order', this.props.status, 'cancel');
    }

    this.props.status = OrderStatus.CANCELLED;
    this.props.cancelledAt = new Date();
    this.props.cancelReason = reason;
    this.touch();

    this.addDomainEvent(new OrderCancelledEvent(this.id, reason));
  }

  /**
   * Add internal note
   */
  addInternalNote(note: string): void {
    const existingNote = this.props.internalNote || '';
    const timestamp = new Date().toISOString();
    this.props.internalNote = existingNote
      ? `${existingNote}\n[${timestamp}] ${note}`
      : `[${timestamp}] ${note}`;
    this.touch();
  }

  // =====================================================================
  // PRIVATE METHODS
  // =====================================================================

  private assertCanTransitionTo(newStatus: OrderStatus): void {
    const validTransitions = VALID_TRANSITIONS[this.props.status];
    if (!validTransitions.includes(newStatus)) {
      throw new InvalidEntityStateError(
        'Order',
        this.props.status,
        `transition to ${newStatus}`,
      );
    }
  }

  // =====================================================================
  // SERIALIZATION
  // =====================================================================

  toPersistence(): Record<string, unknown> {
    return {
      id: this.id,
      tenantId: this.tenantId,
      orderNumber: this.orderNumber,
      customerId: this.customerId,
      customerEmail: this.customerEmail,
      status: this.status,
      subtotal: this.subtotal.amount,
      discount: this.discount.amount,
      shippingCost: this.shippingCost.amount,
      tax: this.tax.amount,
      total: this.total.amount,
      couponCode: this.props.couponCode,
      customerNote: this.props.customerNote,
      internalNote: this.props.internalNote,
      items: this.items.map((item) => ({
        ...item,
        priceAtPurchase: item.priceAtPurchase.amount,
        subtotal: item.subtotal.amount,
      })),
      shippingAddress: this.shippingAddress,
      billingAddress: this.billingAddress,
      payment: this.payment,
      shipping: {
        ...this.shipping,
        shippingCost: this.shipping.shippingCost.amount,
      },
      confirmedAt: this.props.confirmedAt,
      cancelledAt: this.props.cancelledAt,
      cancelReason: this.props.cancelReason,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
