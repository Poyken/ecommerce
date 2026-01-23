/**
 * =====================================================================
 * CATEGORY ENTITY - Domain Layer
 * =====================================================================
 *
 * Clean Architecture: Domain Layer
 *
 * Category represents a product classification in the catalog.
 * Categories can be hierarchical (parent-child relationship).
 *
 * Business Rules:
 * 1. Category slug must be unique within tenant
 * 2. Parent category must exist if specified
 * 3. Category cannot be its own parent (no cycles)
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
  description?: string;
  imageUrl?: string;
  parentId?: string;
  displayOrder: number;
  isActive: boolean;
  metadata?: Record<string, unknown>;
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

  /**
   * Create a new Category
   */
  static create(props: {
    id: string;
    tenantId: string;
    name: string;
    slug?: string;
    description?: string;
    imageUrl?: string;
    parentId?: string;
    displayOrder?: number;
    metadata?: Record<string, unknown>;
  }): Category {
    const slug = props.slug
      ? Slug.create(props.slug)
      : Slug.fromText(props.name);

    return new Category({
      id: props.id,
      tenantId: props.tenantId,
      name: props.name,
      slug,
      description: props.description,
      imageUrl: props.imageUrl,
      parentId: props.parentId,
      displayOrder: props.displayOrder ?? 0,
      isActive: true,
      metadata: props.metadata,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  /**
   * Reconstitute from persistence
   */
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

  get description(): string | undefined {
    return this.props.description;
  }

  get imageUrl(): string | undefined {
    return this.props.imageUrl;
  }

  get parentId(): string | undefined {
    return this.props.parentId;
  }

  get displayOrder(): number {
    return this.props.displayOrder;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  get metadata(): Record<string, unknown> | undefined {
    return this.props.metadata;
  }

  get isRootCategory(): boolean {
    return !this.props.parentId;
  }

  // =====================================================================
  // BUSINESS METHODS
  // =====================================================================

  /**
   * Update category information
   */
  updateInfo(params: {
    name?: string;
    description?: string;
    imageUrl?: string;
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

    if (params.metadata !== undefined) {
      this.props.metadata = params.metadata;
    }

    this.touch();
  }

  /**
   * Move to different parent
   */
  moveToParent(parentId: string | undefined): void {
    if (parentId === this.id) {
      throw new Error('Category cannot be its own parent');
    }

    this.props.parentId = parentId;
    this.touch();
  }

  /**
   * Update display order
   */
  setDisplayOrder(order: number): void {
    this.props.displayOrder = order;
    this.touch();
  }

  /**
   * Activate category
   */
  activate(): void {
    this.props.isActive = true;
    this.touch();
  }

  /**
   * Deactivate category
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
      parentId: this.parentId,
      displayOrder: this.displayOrder,
      isActive: this.isActive,
      metadata: this.metadata,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}
