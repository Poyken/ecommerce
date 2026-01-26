/**
 * =====================================================================
 * PRODUCT ENTITY - Domain Layer (Aggregate Root)
 * =====================================================================
 *
 * Clean Architecture: Domain Layer
 *
 * Product is an Aggregate Root that encapsulates:
 * - Product base information
 * - Categories relationship
 * - Brand relationship
 * - Options (variants definition)
 * - SKUs (actual stock keeping units)
 *
 * Business Rules:
 * 1. Product must have at least one SKU
 * 2. Product slug must be unique within tenant
 * 3. Prices are cached (minPrice, maxPrice) from SKUs
 */

import {
  AggregateRoot,
  BaseDomainEvent,
  EntityProps,
} from '@core/domain/entities/base.entity';
import { Money } from '@core/domain/value-objects/money.vo';
import { Slug } from '@core/domain/value-objects/slug.vo';
import { Sku } from './sku.entity';

// =====================================================================
// DOMAIN EVENTS
// =====================================================================

export class ProductCreatedEvent extends BaseDomainEvent {
  constructor(
    readonly productId: string,
    readonly tenantId: string,
    readonly name: string,
    readonly slug: string,
  ) {
    super('ProductCreated', productId);
  }
}

export class ProductUpdatedEvent extends BaseDomainEvent {
  constructor(
    readonly productId: string,
    readonly changes: Partial<ProductProps>,
  ) {
    super('ProductUpdated', productId);
  }
}

export class ProductDeletedEvent extends BaseDomainEvent {
  constructor(
    readonly productId: string,
    readonly tenantId: string,
  ) {
    super('ProductDeleted', productId);
  }
}

export class ProductPriceChangedEvent extends BaseDomainEvent {
  constructor(
    readonly productId: string,
    readonly oldMinPrice: number,
    readonly newMinPrice: number,
    readonly oldMaxPrice: number,
    readonly newMaxPrice: number,
  ) {
    super('ProductPriceChanged', productId);
  }
}

// =====================================================================
// VALUE OBJECTS (Product-specific)
// =====================================================================

export interface ProductOption {
  readonly id: string;
  readonly name: string;
  readonly displayOrder: number;
  readonly values: ProductOptionValue[];
}

export interface ProductOptionValue {
  readonly id: string;
  readonly value: string;
  readonly imageUrl?: string;
}

export interface ProductImage {
  readonly id: string;
  readonly url: string;
  readonly alt?: string;
  readonly displayOrder: number;
}

// =====================================================================
// ENTITY PROPS
// =====================================================================

export interface ProductProps extends EntityProps {
  tenantId: string;
  name: string;
  slug: Slug;
  description?: string;
  brandId: string;
  categoryIds: string[];

  // Cached price range from SKUs
  minPrice: Money;
  maxPrice: Money;

  // Cached ratings from Reviews
  avgRating: number;
  reviewCount: number;

  // Media
  images: ProductImage[];
  options: ProductOption[];
  skus: Sku[];

  // Metadata
  metadata?: Record<string, unknown>;
  deletedAt?: Date;
}

// =====================================================================
// AGGREGATE ROOT
// =====================================================================

export class Product extends AggregateRoot<ProductProps> {
  private constructor(props: ProductProps) {
    super(props);
  }

  // =====================================================================
  // FACTORY METHODS
  // =====================================================================

  /**
   * Create a new Product
   */
  static create(props: {
    id: string;
    tenantId: string;
    name: string;
    slug?: string;
    description?: string;
    brandId: string;
    categoryIds: string[];
    images?: ProductImage[];
    options?: ProductOption[];
    skus?: Sku[];
    metadata?: Record<string, unknown>;
  }): Product {
    const slug = props.slug
      ? Slug.create(props.slug)
      : Slug.fromText(props.name);

    const product = new Product({
      id: props.id,
      tenantId: props.tenantId,
      name: props.name,
      slug,
      description: props.description,
      brandId: props.brandId,
      categoryIds: props.categoryIds,
      minPrice: Money.zero(),
      maxPrice: Money.zero(),
      avgRating: 0,
      reviewCount: 0,
      images: props.images ?? [],
      options: props.options ?? [],
      skus: props.skus ?? [],
      metadata: props.metadata,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    product.addDomainEvent(
      new ProductCreatedEvent(
        product.id,
        product.tenantId,
        product.name,
        product.slug.value,
      ),
    );

    return product;
  }

  /**
   * Reconstitute from persistence (no events)
   */
  static fromPersistence(props: ProductProps): Product {
    return new Product(props);
  }

  // =====================================================================
  // GETTERS
  // =====================================================================

  get tenantId(): string {
    return this.props.tenantId;
  }

  get name(): string {
    return this.props.name;
  }

  get slug(): Slug {
    return this.props.slug;
  }

  get description(): string | undefined {
    return this.props.description;
  }

  get brandId(): string {
    return this.props.brandId;
  }

  get categoryIds(): readonly string[] {
    return Object.freeze([...this.props.categoryIds]);
  }

  get minPrice(): Money {
    return this.props.minPrice;
  }

  get maxPrice(): Money {
    return this.props.maxPrice;
  }

  get avgRating(): number {
    return this.props.avgRating;
  }

  get reviewCount(): number {
    return this.props.reviewCount;
  }

  get images(): readonly ProductImage[] {
    return Object.freeze([...this.props.images]);
  }

  get options(): readonly ProductOption[] {
    return Object.freeze([...this.props.options]);
  }

  get skus(): readonly Sku[] {
    return Object.freeze([...this.props.skus]);
  }

  get metadata(): Record<string, unknown> | undefined {
    return this.props.metadata;
  }

  get isDeleted(): boolean {
    return !!this.props.deletedAt;
  }

  get deletedAt(): Date | undefined {
    return this.props.deletedAt;
  }

  // =====================================================================
  // BUSINESS METHODS
  // =====================================================================

  /**
   * Update basic product information
   */
  updateInfo(params: {
    name?: string;
    description?: string;
    brandId?: string;
    categoryIds?: string[];
    metadata?: Record<string, unknown>;
  }): void {
    const changes: Partial<ProductProps> = {};

    if (params.name && params.name !== this.props.name) {
      this.props.name = params.name;
      this.props.slug = Slug.fromText(params.name);
      changes.name = params.name;
    }

    if (params.description !== undefined) {
      this.props.description = params.description;
      changes.description = params.description;
    }

    if (params.brandId && params.brandId !== this.props.brandId) {
      this.props.brandId = params.brandId;
      changes.brandId = params.brandId;
    }

    if (params.categoryIds) {
      this.props.categoryIds = [...params.categoryIds];
      changes.categoryIds = params.categoryIds;
    }

    if (params.metadata !== undefined) {
      this.props.metadata = params.metadata;
      changes.metadata = params.metadata;
    }

    if (Object.keys(changes).length > 0) {
      this.touch();
      this.addDomainEvent(new ProductUpdatedEvent(this.id, changes));
    }
  }

  /**
   * Update cached price range (called when SKUs change)
   */
  updatePriceRange(minPrice: Money, maxPrice: Money): void {
    const oldMinPrice = this.props.minPrice.amount;
    const oldMaxPrice = this.props.maxPrice.amount;

    this.props.minPrice = minPrice;
    this.props.maxPrice = maxPrice;
    this.touch();

    if (oldMinPrice !== minPrice.amount || oldMaxPrice !== maxPrice.amount) {
      this.addDomainEvent(
        new ProductPriceChangedEvent(
          this.id,
          oldMinPrice,
          minPrice.amount,
          oldMaxPrice,
          maxPrice.amount,
        ),
      );
    }
  }

  /**
   * Update cached rating stats (called when Reviews change)
   */
  updateRatingStats(avgRating: number, reviewCount: number): void {
    this.props.avgRating = avgRating;
    this.props.reviewCount = reviewCount;
    this.touch();
  }

  /**
   * Set product images
   */
  setImages(images: ProductImage[]): void {
    this.props.images = [...images];
    this.touch();
  }

  /**
   * Set product options (variant definitions)
   */
  setOptions(options: ProductOption[]): void {
    this.props.options = [...options];
    this.touch();
  }

  /**
   * Set product SKUs
   */
  setSkus(skus: Sku[]): void {
    this.props.skus = [...skus];
    this.touch();
  }

  /**
   * Soft delete the product
   */
  delete(): void {
    if (this.props.deletedAt) {
      return; // Already deleted
    }

    this.props.deletedAt = new Date();
    this.touch();
    this.addDomainEvent(new ProductDeletedEvent(this.id, this.tenantId));
  }

  /**
   * Restore soft-deleted product
   */
  restore(): void {
    if (!this.props.deletedAt) {
      return; // Not deleted
    }

    this.props.deletedAt = undefined;
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
      name: this.name,
      slug: this.slug.value,
      description: this.description,
      brandId: this.brandId,
      minPrice: this.minPrice.amount,
      maxPrice: this.maxPrice.amount,
      avgRating: this.avgRating,
      reviewCount: this.reviewCount,
      metadata: this.metadata,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      deletedAt: this.deletedAt,
    };
  }
}
