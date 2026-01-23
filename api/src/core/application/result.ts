/**
 * =====================================================================
 * RESULT PATTERN - Functional Error Handling
 * =====================================================================
 *
 * Clean Architecture: Application Layer
 *
 * The Result pattern provides a way to handle success and failure cases
 * without throwing exceptions. This makes error handling explicit and
 * forces the caller to handle both cases.
 *
 * Benefits:
 * 1. No hidden control flow (exceptions)
 * 2. Type-safe error handling
 * 3. Composable operations (map, flatMap)
 * 4. Clear API contracts
 */

/**
 * Result type - Either success with value or failure with error
 */
export type Result<T, E = Error> = Success<T, E> | Failure<T, E>;

/**
 * Success case
 */
export class Success<T, E = Error> {
  readonly isSuccess = true as const;
  readonly isFailure = false as const;

  constructor(public readonly value: T) {}

  /**
   * Get the value or throw if failure
   */
  getOrThrow(): T {
    return this.value;
  }

  /**
   * Get the value or return default
   */
  getOrDefault(_defaultValue: T): T {
    return this.value;
  }

  /**
   * Transform the success value
   */
  map<U>(fn: (value: T) => U): Result<U, E> {
    return new Success(fn(this.value));
  }

  /**
   * Chain another operation that returns a Result
   */
  flatMap<U>(fn: (value: T) => Result<U, E>): Result<U, E> {
    return fn(this.value);
  }

  /**
   * Handle both cases
   */
  match<U>(handlers: {
    onSuccess: (value: T) => U;
    onFailure: (error: E) => U;
  }): U {
    return handlers.onSuccess(this.value);
  }
}

/**
 * Failure case
 */
export class Failure<T, E = Error> {
  readonly isSuccess = false as const;
  readonly isFailure = true as const;

  constructor(public readonly error: E) {}

  /**
   * Get the value or throw the error
   */
  getOrThrow(): never {
    throw this.error;
  }

  /**
   * Get the value or return default
   */
  getOrDefault(defaultValue: T): T {
    return defaultValue;
  }

  /**
   * Transform - returns the same failure (no-op for Failure)
   */
  map<U>(_fn: (value: T) => U): Result<U, E> {
    return new Failure(this.error);
  }

  /**
   * Chain - returns the same failure (no-op for Failure)
   */
  flatMap<U>(_fn: (value: T) => Result<U, E>): Result<U, E> {
    return new Failure(this.error);
  }

  /**
   * Handle both cases
   */
  match<U>(handlers: {
    onSuccess: (value: T) => U;
    onFailure: (error: E) => U;
  }): U {
    return handlers.onFailure(this.error);
  }
}

/**
 * Result factory functions
 */
export const Result = {
  /**
   * Create a success result
   */
  ok<T, E = Error>(value: T): Result<T, E> {
    return new Success(value);
  },

  /**
   * Create a failure result
   */
  fail<T, E = Error>(error: E): Result<T, E> {
    return new Failure(error);
  },

  /**
   * Wrap a function that might throw into a Result
   */
  fromTry<T>(fn: () => T): Result<T, Error> {
    try {
      return new Success(fn());
    } catch (error) {
      return new Failure(
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  },

  /**
   * Wrap an async function that might throw into a Result
   */
  async fromTryAsync<T>(fn: () => Promise<T>): Promise<Result<T, Error>> {
    try {
      const value = await fn();
      return new Success(value);
    } catch (error) {
      return new Failure(
        error instanceof Error ? error : new Error(String(error)),
      );
    }
  },

  /**
   * Combine multiple results - all must succeed
   */
  combine<T, E = Error>(results: Result<T, E>[]): Result<T[], E> {
    const values: T[] = [];
    for (const result of results) {
      if (result.isFailure) {
        return new Failure(result.error);
      }
      values.push(result.value);
    }
    return new Success(values);
  },

  /**
   * Check if value is a Result
   */
  isResult<T, E>(value: unknown): value is Result<T, E> {
    return value instanceof Success || value instanceof Failure;
  },
};
