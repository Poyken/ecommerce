/**
 * =====================================================================
 * BASE ENTITY - Foundation for all Domain Entities
 * =====================================================================
 *
 * Clean Architecture: Domain Layer
 * This is the base class for all entities in the domain layer.
 * It provides common properties and equality comparison.
 *
 * Key Principles:
 * 1. Framework Independence - No NestJS/Prisma dependencies
 * 2. Immutability - Properties should be readonly when possible
 * 3. Identity - Entities are compared by ID, not by value
 */

export interface EntityProps {
  id: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export abstract class BaseEntity<TProps extends EntityProps> {
  protected readonly _id: string;
  protected readonly _createdAt: Date;
  protected _updatedAt: Date;
  protected props: TProps;

  constructor(props: TProps) {
    this._id = props.id;
    this._createdAt = props.createdAt ?? new Date();
    this._updatedAt = props.updatedAt ?? new Date();
    this.props = props;
  }

  get id(): string {
    return this._id;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  /**
   * Check equality based on entity ID
   * Two entities are equal if they have the same ID
   */
  equals(entity?: BaseEntity<TProps>): boolean {
    if (entity === null || entity === undefined) {
      return false;
    }

    if (this === entity) {
      return true;
    }

    return this._id === entity._id;
  }

  /**
   * Mark entity as updated (touch updatedAt)
   */
  protected touch(): void {
    this._updatedAt = new Date();
  }
}

/**
 * Aggregate Root - Special entity that is the entry point to an aggregate
 * Aggregates are clusters of domain objects that are treated as a single unit
 */
export abstract class AggregateRoot<
  TProps extends EntityProps,
> extends BaseEntity<TProps> {
  private _domainEvents: DomainEvent[] = [];

  get domainEvents(): readonly DomainEvent[] {
    return Object.freeze([...this._domainEvents]);
  }

  protected addDomainEvent(event: DomainEvent): void {
    this._domainEvents.push(event);
  }

  clearDomainEvents(): void {
    this._domainEvents = [];
  }
}

/**
 * Domain Event - Represents something that happened in the domain
 */
export interface DomainEvent {
  readonly eventName: string;
  readonly occurredAt: Date;
  readonly aggregateId: string;
}

export abstract class BaseDomainEvent implements DomainEvent {
  readonly occurredAt: Date;

  constructor(
    readonly eventName: string,
    readonly aggregateId: string,
  ) {
    this.occurredAt = new Date();
  }
}
