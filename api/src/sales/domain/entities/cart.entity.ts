/**
 * =====================================================================
 * CART ENTITY - Domain Layer (Aggregate Root)
 * =====================================================================
 *
 * Clean Architecture: Domain Layer
 *
 * Cart represents a customer's shopping session.
 * It contains items with references to SKUs and handles quantity management.
 *
 * Business Rules:
 * 1. Cannot add item with quantity <= 0
 * 2. Cart item quantity cannot exceed available stock
 * 3. Abandoned carts should be cleaned up after X days
 */

import {
  AggregateRoot,
  BaseDomainEvent,
  EntityProps,
} from '@core/domain/entities/base.entity';
import { Money } from '@core/domain/value-objects/money.vo';
import { BusinessRuleViolationError } from '@core/domain/errors/domain.error';

// =====================================================================
// DOMAIN EVENTS
// =====================================================================

export class ItemAddedToCartEvent extends BaseDomainEvent {
  constructor(
    readonly cartId: string,
    readonly skuId: string,
    readonly quantity: number,
  ) {
    super('ItemAddedToCart', cartId);
  }
}

export class ItemRemovedFromCartEvent extends BaseDomainEvent {
  constructor(
    readonly cartId: string,
    readonly skuId: string,
  ) {
    super('ItemRemovedFromCart', cartId);
  }
}

export class CartClearedEvent extends BaseDomainEvent {
  constructor(readonly cartId: string) {
    super('CartCleared', cartId);
  }
}

// =====================================================================
// VALUE OBJECTS (Cart-specific)
// =====================================================================

export interface CartItem {
  readonly id: string;
  readonly skuId: string;
  readonly productId: string;
  readonly productName: string;
  readonly skuCode: string;
  readonly variantLabel: string;
  readonly imageUrl?: string;
  readonly unitPrice: Money;
  quantity: number;
}

// =====================================================================
// ENTITY PROPS
// =====================================================================

export interface CartProps extends EntityProps {
  tenantId: string;
  customerId?: string; // null for guest carts
  sessionId?: string; // For guest identification
  items: CartItem[];
  couponCode?: string;
  lastActivityAt: Date;
}

// =====================================================================
// AGGREGATE ROOT
// =====================================================================

export class Cart extends AggregateRoot<CartProps> {
  private constructor(props: CartProps) {
    super(props);
  }

  // =====================================================================
  // FACTORY METHODS
  // =====================================================================

  /**
   * Create a new Cart
   */
  static create(props: {
    id: string;
    tenantId: string;
    customerId?: string;
    sessionId?: string;
  }): Cart {
    return new Cart({
      id: props.id,
      tenantId: props.tenantId,
      customerId: props.customerId,
      sessionId: props.sessionId,
      items: [],
      lastActivityAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  /**
   * Reconstitute from persistence
   */
  static fromPersistence(props: CartProps): Cart {
    return new Cart(props);
  }

  // =====================================================================
  // GETTERS
  // =====================================================================

  get tenantId(): string {
    return this.props.tenantId;
  }

  get customerId(): string | undefined {
    return this.props.customerId;
  }

  get sessionId(): string | undefined {
    return this.props.sessionId;
  }

  get items(): readonly CartItem[] {
    return Object.freeze([...this.props.items]);
  }

  get itemCount(): number {
    return this.props.items.reduce((sum, item) => sum + item.quantity, 0);
  }

  get uniqueItemCount(): number {
    return this.props.items.length;
  }

  get subtotal(): Money {
    return this.props.items.reduce(
      (sum, item) => sum.add(item.unitPrice.multiply(item.quantity)),
      Money.zero(),
    );
  }

  get couponCode(): string | undefined {
    return this.props.couponCode;
  }

  get isEmpty(): boolean {
    return this.props.items.length === 0;
  }

  get isGuest(): boolean {
    return !this.props.customerId;
  }

  get lastActivityAt(): Date {
    return this.props.lastActivityAt;
  }

  // =====================================================================
  // BUSINESS METHODS
  // =====================================================================

  /**
   * Add item to cart
   */
  addItem(item: Omit<CartItem, 'quantity'>, quantity: number): void {
    if (quantity <= 0) {
      throw new BusinessRuleViolationError(
        'Quantity must be positive',
        `Attempted to add ${quantity} items`,
      );
    }

    const existingIndex = this.props.items.findIndex(
      (i) => i.skuId === item.skuId,
    );

    if (existingIndex >= 0) {
      // Update existing item
      this.props.items[existingIndex].quantity += quantity;
    } else {
      // Add new item
      this.props.items.push({ ...item, quantity });
    }

    this.updateActivity();
    this.addDomainEvent(
      new ItemAddedToCartEvent(this.id, item.skuId, quantity),
    );
  }

  /**
   * Update item quantity
   */
  updateItemQuantity(skuId: string, quantity: number): void {
    if (quantity <= 0) {
      this.removeItem(skuId);
      return;
    }

    const item = this.props.items.find((i) => i.skuId === skuId);
    if (item) {
      item.quantity = quantity;
      this.updateActivity();
    }
  }

  /**
   * Remove item from cart
   */
  removeItem(skuId: string): void {
    const index = this.props.items.findIndex((i) => i.skuId === skuId);
    if (index >= 0) {
      this.props.items.splice(index, 1);
      this.updateActivity();
      this.addDomainEvent(new ItemRemovedFromCartEvent(this.id, skuId));
    }
  }

  /**
   * Clear all items
   */
  clear(): void {
    if (this.props.items.length > 0) {
      this.props.items = [];
      this.props.couponCode = undefined;
      this.updateActivity();
      this.addDomainEvent(new CartClearedEvent(this.id));
    }
  }

  /**
   * Apply coupon code
   */
  applyCoupon(code: string): void {
    this.props.couponCode = code;
    this.updateActivity();
  }

  /**
   * Remove coupon
   */
  removeCoupon(): void {
    this.props.couponCode = undefined;
    this.updateActivity();
  }

  /**
   * Assign cart to customer (after login)
   */
  assignToCustomer(customerId: string): void {
    this.props.customerId = customerId;
    this.props.sessionId = undefined;
    this.updateActivity();
  }

  /**
   * Merge another cart into this one
   */
  mergeFrom(otherCart: Cart): void {
    for (const item of otherCart.items) {
      this.addItem(
        {
          id: item.id,
          skuId: item.skuId,
          productId: item.productId,
          productName: item.productName,
          skuCode: item.skuCode,
          variantLabel: item.variantLabel,
          imageUrl: item.imageUrl,
          unitPrice: item.unitPrice,
        },
        item.quantity,
      );
    }
  }

  /**
   * Get item by SKU ID
   */
  getItem(skuId: string): CartItem | undefined {
    return this.props.items.find((i) => i.skuId === skuId);
  }

  /**
   * Check if cart contains a specific SKU
   */
  containsSku(skuId: string): boolean {
    return this.props.items.some((i) => i.skuId === skuId);
  }

  // =====================================================================
  // PRIVATE METHODS
  // =====================================================================

  private updateActivity(): void {
    this.props.lastActivityAt = new Date();
    this.touch();
  }

  // =====================================================================
  // SERIALIZATION
  // =====================================================================

  toPersistence(): Record<string, unknown> {
    return {
      id: this.id,
      tenantId: this.tenantId,
      customerId: this.customerId,
      sessionId: this.sessionId,
      couponCode: this.couponCode,
      lastActivityAt: this.lastActivityAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
