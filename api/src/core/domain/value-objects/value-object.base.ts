/**
 * =====================================================================
 * VALUE OBJECT BASE - Foundation for all Value Objects
 * =====================================================================
 *
 * Clean Architecture: Domain Layer
 *
 * Value Objects are immutable objects that represent concepts from your domain.
 * Unlike Entities, they are defined by their attributes rather than an ID.
 *
 * Examples: Money, Email, PhoneNumber, Address, Slug
 *
 * Key Principles:
 * 1. Immutability - Once created, cannot be changed
 * 2. Equality by Value - Two VOs are equal if all their properties are equal
 * 3. Self-Validation - VOs validate themselves on creation
 */

export abstract class ValueObject<T> {
  protected readonly props: T;

  constructor(props: T) {
    this.props = Object.freeze(props);
  }

  /**
   * Check equality based on all properties
   */
  equals(vo?: ValueObject<T>): boolean {
    if (vo === null || vo === undefined) {
      return false;
    }

    if (this === vo) {
      return true;
    }

    return JSON.stringify(this.props) === JSON.stringify(vo.props);
  }

  /**
   * Get the raw value (useful for persistence)
   */
  abstract toValue(): unknown;
}
