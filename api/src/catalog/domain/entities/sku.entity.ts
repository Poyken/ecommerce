/**
 * =====================================================================
 * SKU ENTITY - Domain Layer (Entity within Product Aggregate)
 * =====================================================================
 *
 * Clean Architecture: Domain Layer
 *
 * SKU (Stock Keeping Unit) represents a specific variant of a product.
 * For example: "iPhone 15 - Red - 256GB" is one SKU.
 *
 * Business Rules:
 * 1. SKU code must be unique within tenant
 * 2. Price must be positive
 * 3. Stock cannot be negative
 * 4. SKU belongs to exactly one Product
 */

import { BaseEntity, EntityProps } from '@core/domain/entities/base.entity';
import { Money } from '@core/domain/value-objects/money.vo';
import { InsufficientResourceError } from '@core/domain/errors/domain.error';

// =====================================================================
// ENUMS
// =====================================================================

export enum SkuStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  OUT_OF_STOCK = 'OUT_OF_STOCK',
}

// =====================================================================
// VALUE OBJECTS (SKU-specific)
// =====================================================================

export interface SkuOptionValue {
  readonly optionId: string;
  readonly optionName: string;
  readonly valueId: string;
  readonly value: string;
}

export interface SkuImage {
  readonly id: string;
  readonly url: string;
  readonly alt?: string;
  readonly displayOrder: number;
}

// =====================================================================
// ENTITY PROPS
// =====================================================================

export interface SkuProps extends EntityProps {
  tenantId: string;
  productId: string;
  skuCode: string;

  // Pricing
  price: Money;
  salePrice?: Money;

  // Inventory
  stock: number;
  reservedStock: number;

  // Status
  status: SkuStatus;

  // Variant identification
  optionValues: SkuOptionValue[];

  // Media
  imageUrl?: string;
  images: SkuImage[];

  // Weight for shipping calculation
  weight?: number;
}

// =====================================================================
// ENTITY
// =====================================================================

export class Sku extends BaseEntity<SkuProps> {
  private constructor(props: SkuProps) {
    super(props);
  }

  // =====================================================================
  // FACTORY METHODS
  // =====================================================================

  /**
   * Create a new SKU
   */
  static create(props: {
    id: string;
    tenantId: string;
    productId: string;
    skuCode: string;
    price: Money;
    salePrice?: Money;
    stock?: number;
    optionValues: SkuOptionValue[];
    imageUrl?: string;
    images?: SkuImage[];
    weight?: number;
  }): Sku {
    return new Sku({
      id: props.id,
      tenantId: props.tenantId,
      productId: props.productId,
      skuCode: props.skuCode,
      price: props.price,
      salePrice: props.salePrice,
      stock: props.stock ?? 0,
      reservedStock: 0,
      status:
        props.stock && props.stock > 0
          ? SkuStatus.ACTIVE
          : SkuStatus.OUT_OF_STOCK,
      optionValues: props.optionValues,
      imageUrl: props.imageUrl,
      images: props.images ?? [],
      weight: props.weight,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  /**
   * Reconstitute from persistence
   */
  static fromPersistence(props: SkuProps): Sku {
    return new Sku(props);
  }

  // =====================================================================
  // GETTERS
  // =====================================================================

  get tenantId(): string {
    return this.props.tenantId;
  }

  get productId(): string {
    return this.props.productId;
  }

  get skuCode(): string {
    return this.props.skuCode;
  }

  get price(): Money {
    return this.props.price;
  }

  get salePrice(): Money | undefined {
    return this.props.salePrice;
  }

  /**
   * Get the effective selling price (salePrice if available, else price)
   */
  get effectivePrice(): Money {
    return this.props.salePrice ?? this.props.price;
  }

  get stock(): number {
    return this.props.stock;
  }

  get reservedStock(): number {
    return this.props.reservedStock;
  }

  /**
   * Available stock = total stock - reserved
   */
  get availableStock(): number {
    return this.props.stock - this.props.reservedStock;
  }

  get status(): SkuStatus {
    return this.props.status;
  }

  get optionValues(): readonly SkuOptionValue[] {
    return Object.freeze([...this.props.optionValues]);
  }

  get imageUrl(): string | undefined {
    return this.props.imageUrl;
  }

  get images(): readonly SkuImage[] {
    return Object.freeze([...this.props.images]);
  }

  get weight(): number | undefined {
    return this.props.weight;
  }

  get isActive(): boolean {
    return this.props.status === SkuStatus.ACTIVE;
  }

  get isInStock(): boolean {
    return this.availableStock > 0;
  }

  // =====================================================================
  // BUSINESS METHODS
  // =====================================================================

  /**
   * Update price
   */
  updatePrice(price: Money, salePrice?: Money): void {
    this.props.price = price;
    this.props.salePrice = salePrice;
    this.touch();
  }

  /**
   * Update stock (absolute value)
   */
  updateStock(newStock: number): void {
    if (newStock < 0) {
      throw new InsufficientResourceError('stock', 0, newStock);
    }

    this.props.stock = newStock;

    // Update status based on stock
    if (newStock === 0 && this.props.status === SkuStatus.ACTIVE) {
      this.props.status = SkuStatus.OUT_OF_STOCK;
    } else if (newStock > 0 && this.props.status === SkuStatus.OUT_OF_STOCK) {
      this.props.status = SkuStatus.ACTIVE;
    }

    this.touch();
  }

  /**
   * Add stock (relative)
   */
  addStock(quantity: number): void {
    if (quantity < 0) {
      throw new Error('Use removeStock for negative quantities');
    }

    this.updateStock(this.props.stock + quantity);
  }

  /**
   * Remove stock (relative)
   */
  removeStock(quantity: number): void {
    if (quantity < 0) {
      throw new Error('Quantity must be positive');
    }

    if (this.availableStock < quantity) {
      throw new InsufficientResourceError(
        'stock',
        quantity,
        this.availableStock,
      );
    }

    this.updateStock(this.props.stock - quantity);
  }

  /**
   * Reserve stock for pending order
   */
  reserveStock(quantity: number): void {
    if (this.availableStock < quantity) {
      throw new InsufficientResourceError(
        'stock',
        quantity,
        this.availableStock,
      );
    }

    this.props.reservedStock += quantity;
    this.touch();
  }

  /**
   * Release reserved stock (order cancelled)
   */
  releaseReservedStock(quantity: number): void {
    this.props.reservedStock = Math.max(0, this.props.reservedStock - quantity);
    this.touch();
  }

  /**
   * Confirm reserved stock (order confirmed -> reduce actual stock)
   */
  confirmReservedStock(quantity: number): void {
    const toConfirm = Math.min(quantity, this.props.reservedStock);
    this.props.reservedStock -= toConfirm;
    this.removeStock(toConfirm);
  }

  /**
   * Activate SKU
   */
  activate(): void {
    if (this.props.stock > 0) {
      this.props.status = SkuStatus.ACTIVE;
    } else {
      this.props.status = SkuStatus.OUT_OF_STOCK;
    }
    this.touch();
  }

  /**
   * Deactivate SKU (hide from storefront)
   */
  deactivate(): void {
    this.props.status = SkuStatus.INACTIVE;
    this.touch();
  }

  /**
   * Update image
   */
  updateImage(imageUrl: string): void {
    this.props.imageUrl = imageUrl;
    this.touch();
  }

  /**
   * Set images gallery
   */
  setImages(images: SkuImage[]): void {
    this.props.images = [...images];
    this.touch();
  }

  /**
   * Update weight
   */
  updateWeight(weight: number): void {
    this.props.weight = weight;
    this.touch();
  }

  // =====================================================================
  // HELPER METHODS
  // =====================================================================

  /**
   * Get variant label (e.g., "Red / XL")
   */
  getVariantLabel(): string {
    return this.props.optionValues.map((ov) => ov.value).join(' / ');
  }

  /**
   * Check if this SKU matches given option values
   */
  matchesOptions(optionValueIds: string[]): boolean {
    const myValueIds = new Set(this.props.optionValues.map((ov) => ov.valueId));
    return optionValueIds.every((id) => myValueIds.has(id));
  }

  // =====================================================================
  // SERIALIZATION
  // =====================================================================

  /**
   * Convert to plain object for persistence
   */
  toPersistence(): Record<string, unknown> {
    return {
      id: this.id,
      tenantId: this.tenantId,
      productId: this.productId,
      skuCode: this.skuCode,
      price: this.price.amount,
      salePrice: this.salePrice?.amount,
      stock: this.stock,
      reservedStock: this.reservedStock,
      status: this.status,
      imageUrl: this.imageUrl,
      weight: this.weight,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
