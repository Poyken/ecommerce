/**
 * =====================================================================
 * CATEGORY ENTITY - Domain Layer
 * =====================================================================
 */

import { BaseEntity, EntityProps } from '@core/domain/entities/base.entity';
import { Slug } from '@core/domain/value-objects/slug.vo';

// =====================================================================
// ENTITY PROPS
// =====================================================================

export interface CategoryProps extends EntityProps {
  tenantId: string;
  name: string;
  slug: Slug;
  imageUrl?: string;
  parentId?: string;
  productCount?: number;
  deletedAt?: Date;
}

// =====================================================================
// ENTITY
// =====================================================================

export class Category extends BaseEntity<CategoryProps> {
  private constructor(props: CategoryProps) {
    super(props);
  }

  // =====================================================================
  // FACTORY METHODS
  // =====================================================================

  static create(props: {
    id: string;
    tenantId: string;
    name: string;
    slug?: string;
    imageUrl?: string;
    parentId?: string;
    productCount?: number;
  }): Category {
    const slug = props.slug
      ? Slug.create(props.slug)
      : Slug.fromText(props.name);

    return new Category({
      id: props.id,
      tenantId: props.tenantId,
      name: props.name,
      slug,
      imageUrl: props.imageUrl,
      parentId: props.parentId,
      productCount: props.productCount ?? 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: undefined,
    });
  }

  static fromPersistence(props: CategoryProps): Category {
    return new Category(props);
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

  get parentId(): string | undefined {
    return this.props.parentId;
  }

  get productCount(): number {
    return this.props.productCount ?? 0;
  }

  get isRootCategory(): boolean {
    return !this.props.parentId;
  }

  get deletedAt(): Date | undefined {
    return this.props.deletedAt;
  }

  // =====================================================================
  // BUSINESS METHODS
  // =====================================================================

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

  moveToParent(parentId: string | undefined): void {
    if (parentId === this.id) {
      throw new Error('Category cannot be its own parent');
    }

    this.props.parentId = parentId;
    this.touch();
  }

  // =====================================================================
  // SERIALIZATION
  // =====================================================================

  toPersistence(): Record<string, unknown> {
    return {
      id: this.id,
      tenantId: this.tenantId,
      name: this.name,
      slug: this.slug.value,
      imageUrl: this.imageUrl,
      parentId: this.parentId,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      deletedAt: this.deletedAt,
    };
  }
}
