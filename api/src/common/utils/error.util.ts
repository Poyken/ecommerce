import { NotFoundException } from '@nestjs/common';

/**
 * =====================================================================
 * ERROR HANDLING UTILITIES - CONSISTENT ERROR MANAGEMENT
 * =====================================================================
 * 
 * 📚 PURPOSE:
 * Provide type-safe assertion helpers to standardize error handling
 * across all services and avoid inconsistent null checks.
 * 
 * 🎯 BENEFITS:
 * - Type narrowing: TypeScript knows value is not null after assertion
 * - Consistent error messages in Vietnamese
 * - Less boilerplate code
 * - Better DX (Developer Experience)
 * 
 * BEFORE (Inconsistent):
 * ```typescript
 * if (!product) return null;           // Bad: inconsistent
 * if (!product) throw new Error(...);  // Bad: not specific
 * ```
 * 
 * AFTER (Standard):
 * ```typescript
 * assertExists(product, 'Product không tồn tại');
 * // TypeScript now knows product is not null
 * ```
 * =====================================================================
 */

/**
 * Assert that a value exists (not null/undefined) or throw NotFoundException
 * @param value - The value to check
 * @param message - Error message to show user (Vietnamese recommended)
 * @throws NotFoundException if value is null or undefined
 */
export function assertExists<T>(
  value: T | null | undefined,
  message: string,
): asserts value is T {
  if (value === null || value === undefined) {
    throw new NotFoundException(message);
  }
}

/**
 * Assert with custom exception
 * @param value - The value to check
 * @param exception - Custom exception to throw
 */
export function assert<T>(
  value: T | null | undefined,
  exception: Error,
): asserts value is T {
  if (value === null || value === undefined) {
    throw exception;
  }
}
