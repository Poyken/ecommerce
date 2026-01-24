/**
 * =====================================================================
 * BRAND ENTITY - Domain Layer
 * =====================================================================
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
  imageUrl?: string;
  deletedAt?: Date;
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
    imageUrl?: string;
  }): Brand {
    const slug = props.slug
      ? Slug.create(props.slug)
      : Slug.fromText(props.name);

    return new Brand({
      id: props.id,
      tenantId: props.tenantId,
      name: props.name,
      slug,
      imageUrl: props.imageUrl,
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

  get imageUrl(): string | undefined {
    return this.props.imageUrl;
  }

  get deletedAt(): Date | undefined {
    return this.props.deletedAt;
  }

  // =====================================================================
  // BUSINESS METHODS
  // =====================================================================

  /**
   * Update brand information
   */
  updateInfo(params: { name?: string; imageUrl?: string }): void {
    if (params.name && params.name !== this.props.name) {
      this.props.name = params.name;
      this.props.slug = Slug.fromText(params.name);
    }

    if (params.imageUrl !== undefined) {
      this.props.imageUrl = params.imageUrl;
    }

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
      imageUrl: this.imageUrl,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      deletedAt: this.deletedAt,
    };
  }
}
