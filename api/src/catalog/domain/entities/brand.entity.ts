/**
 * =====================================================================
 * BRAND ENTITY - Domain Layer
 * =====================================================================
 *
 * Clean Architecture: Domain Layer
 *
 * Brand represents a product manufacturer or trademark.
 *
 * Business Rules:
 * 1. Brand slug must be unique within tenant
 * 2. Brand can be active/inactive
 */

import { BaseEntity, EntityProps } from '@core/domain/entities/base.entity';
import { Slug } from '@core/domain/value-objects/slug.vo';

// =====================================================================
// ENTITY PROPS
// =====================================================================

export interface BrandProps extends EntityProps {
  tenantId: string;
  name: string;
  slug: Slug;
  description?: string;
  imageUrl?: string;
  website?: string;
  isActive: boolean;
  metadata?: Record<string, unknown>;
}

// =====================================================================
// ENTITY
// =====================================================================

export class Brand extends BaseEntity<BrandProps> {
  private constructor(props: BrandProps) {
    super(props);
  }

  // =====================================================================
  // FACTORY METHODS
  // =====================================================================

  /**
   * Create a new Brand
   */
  static create(props: {
    id: string;
    tenantId: string;
    name: string;
    slug?: string;
    description?: string;
    imageUrl?: string;
    website?: string;
    metadata?: Record<string, unknown>;
  }): Brand {
    const slug = props.slug
      ? Slug.create(props.slug)
      : Slug.fromText(props.name);

    return new Brand({
      id: props.id,
      tenantId: props.tenantId,
      name: props.name,
      slug,
      description: props.description,
      imageUrl: props.imageUrl,
      website: props.website,
      isActive: true,
      metadata: props.metadata,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  /**
   * Reconstitute from persistence
   */
  static fromPersistence(props: BrandProps): Brand {
    return new Brand(props);
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

  get imageUrl(): string | undefined {
    return this.props.imageUrl;
  }

  get website(): string | undefined {
    return this.props.website;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get metadata(): Record<string, unknown> | undefined {
    return this.props.metadata;
  }

  // =====================================================================
  // BUSINESS METHODS
  // =====================================================================

  /**
   * Update brand information
   */
  updateInfo(params: {
    name?: string;
    description?: string;
    imageUrl?: string;
    website?: string;
    metadata?: Record<string, unknown>;
  }): void {
    if (params.name && params.name !== this.props.name) {
      this.props.name = params.name;
      this.props.slug = Slug.fromText(params.name);
    }

    if (params.description !== undefined) {
      this.props.description = params.description;
    }

    if (params.imageUrl !== undefined) {
      this.props.imageUrl = params.imageUrl;
    }

    if (params.website !== undefined) {
      this.props.website = params.website;
    }

    if (params.metadata !== undefined) {
      this.props.metadata = params.metadata;
    }

    this.touch();
  }

  /**
   * Activate brand
   */
  activate(): void {
    this.props.isActive = true;
    this.touch();
  }

  /**
   * Deactivate brand
   */
  deactivate(): void {
    this.props.isActive = false;
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
      imageUrl: this.imageUrl,
      website: this.website,
      isActive: this.isActive,
      metadata: this.metadata,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
