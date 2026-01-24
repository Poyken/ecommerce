/**
 * =====================================================================
 * DOMAIN ERRORS - Business Rule Violations
 * =====================================================================
 *
 * Clean Architecture: Domain Layer
 *
 * Domain errors represent violations of business rules.
 * They are different from infrastructure errors (DB connection, network, etc.)
 *
 * These errors should be:
 * 1. Descriptive - Clear message about what went wrong
 * 2. Hierarchical - Can be caught at different levels
 * 3. Framework-agnostic - No NestJS exceptions here
 */

export abstract class DomainError extends Error {
  abstract readonly code: string;

  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Entity not found in the domain
 */
export class EntityNotFoundError extends DomainError {
  readonly code = 'ENTITY_NOT_FOUND';

  constructor(
    entityName: string,
    identifier: string | Record<string, unknown>,
  ) {
    const idString =
      typeof identifier === 'string' ? identifier : JSON.stringify(identifier);
    super(`${entityName} not found: ${idString}`);
  }
}

/**
 * Business rule violation
 */
export class BusinessRuleViolationError extends DomainError {
  readonly code = 'BUSINESS_RULE_VIOLATION';

  constructor(rule: string, details?: string) {
    super(`Business rule violated: ${rule}${details ? `. ${details}` : ''}`);
  }
}

/**
 * Invalid entity state
 */
export class InvalidEntityStateError extends DomainError {
  readonly code = 'INVALID_ENTITY_STATE';

  constructor(
    entityName: string,
    currentState: string,
    attemptedAction: string,
  ) {
    super(`Cannot ${attemptedAction} ${entityName} in state: ${currentState}`);
  }
}

/**
 * Validation error for value objects
 */
export class ValidationError extends DomainError {
  readonly code = 'VALIDATION_ERROR';

  constructor(field: string, message: string) {
    super(`Validation failed for ${field}: ${message}`);
  }
}

/**
 * Authorization error in domain context
 */
export class UnauthorizedDomainError extends DomainError {
  readonly code = 'UNAUTHORIZED';

  constructor(action: string, resource: string) {
    super(`Not authorized to ${action} on ${resource}`);
  }
}

/**
 * Concurrency conflict (optimistic locking)
 */
export class ConcurrencyError extends DomainError {
  readonly code = 'CONCURRENCY_CONFLICT';

  constructor(entityName: string, entityId: string) {
    super(
      `Concurrency conflict for ${entityName}:${entityId}. Entity was modified by another process.`,
    );
  }
}

/**
 * Insufficient resources (stock, balance, etc.)
 */
export class InsufficientResourceError extends DomainError {
  readonly code = 'INSUFFICIENT_RESOURCE';

  constructor(resource: string, required: number, available: number) {
    super(
      `Insufficient ${resource}: required ${required}, available ${available}`,
    );
  }
}

/**
 * Permission denied for specific resource
 */
export class ForbiddenError extends DomainError {
  readonly code = 'FORBIDDEN';

  constructor(message: string) {
    super(message);
  }
}
