/**
 * =====================================================================
 * SKU ENTITY - Domain Layer (Entity within Product Aggregate)
 * =====================================================================
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
}

// =====================================================================
// VALUE OBJECTS (SKU-specific)
// =====================================================================

export interface SkuOptionValue {
  readonly optionId: string;
  readonly valueId: string;
  readonly value: string; // The text value (e.g., "Red")
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

  productName?: string;
  variantLabel?: string;
  metadata?: Record<string, unknown>;
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
    productName?: string;
    variantLabel?: string;
    metadata?: Record<string, unknown>;
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
      status: SkuStatus.INACTIVE, // Default to inactive until activated
      optionValues: props.optionValues,
      imageUrl: props.imageUrl,
      images: props.images ?? [],
      productName: props.productName,
      variantLabel: props.variantLabel,
      metadata: props.metadata,
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

  get isActive(): boolean {
    return this.props.status === SkuStatus.ACTIVE;
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

  get productName(): string | undefined {
    return this.props.productName;
  }

  get variantLabel(): string | undefined {
    return this.props.variantLabel;
  }

  get metadata(): Record<string, unknown> | undefined {
    return this.props.metadata;
  }

  get isInStock(): boolean {
    return this.availableStock > 0;
  }

  // =====================================================================
  // BUSINESS METHODS
  // =====================================================================

  /**
   * Update SKU info
   */
  updateInfo(params: {
    skuCode?: string;
    price?: Money;
    salePrice?: Money;
    imageUrl?: string;
    metadata?: Record<string, unknown>;
    status?: SkuStatus;
    optionValues?: SkuOptionValue[];
    productName?: string;
    variantLabel?: string;
  }): void {
    if (params.skuCode) this.props.skuCode = params.skuCode;
    if (params.price) this.props.price = params.price;
    if (params.salePrice !== undefined) this.props.salePrice = params.salePrice;
    if (params.imageUrl !== undefined) this.props.imageUrl = params.imageUrl;
    if (params.metadata !== undefined) this.props.metadata = params.metadata;
    if (params.status) this.props.status = params.status;
    if (params.optionValues) this.props.optionValues = params.optionValues;
    if (params.productName) this.props.productName = params.productName;
    if (params.variantLabel) this.props.variantLabel = params.variantLabel;

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
    this.touch();
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
   * Release reserved stock
   */
  releaseReservedStock(quantity: number): void {
    this.props.reservedStock = Math.max(0, this.props.reservedStock - quantity);
    this.touch();
  }

  /**
   * Confirm reserved stock
   */
  confirmReservedStock(quantity: number): void {
    const toConfirm = Math.min(quantity, this.props.reservedStock);
    this.props.reservedStock -= toConfirm;
    this.updateStock(this.props.stock - toConfirm);
  }

  /**
   * Activate SKU
   */
  activate(): void {
    this.props.status = SkuStatus.ACTIVE;
    this.touch();
  }

  /**
   * Deactivate SKU
   */
  deactivate(): void {
    this.props.status = SkuStatus.INACTIVE;
    this.touch();
  }

  /**
   * Set images gallery
   */
  setImages(images: SkuImage[]): void {
    this.props.images = [...images];
    this.touch();
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
      productName: this.productName,
      variantLabel: this.variantLabel,
      metadata: this.metadata,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
