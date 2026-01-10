/**
 * =====================================================================
 * TYPE UTILITIES - Các type helpers cho TypeScript
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. UTILITY TYPES:
 * - TypeScript có sẵn Partial, Required, Pick, Omit...
 * - Đây là bộ thêm các utility types hữu ích khác.
 *
 * 2. WHY USE THESE?
 * - Giúp code type-safe hơn.
 * - Giảm boilerplate khi định nghĩa types.
 * =====================================================================
 */

// ============================================================================
// BASIC UTILITY TYPES
// ============================================================================

/**
 * Make specific properties optional.
 * @example PartialBy<User, "email" | "phone"> // email và phone là optional
 */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Make specific properties required.
 * @example RequiredBy<User, "email"> // email bắt buộc, còn lại giữ nguyên
 */
export type RequiredBy<T, K extends keyof T> = Omit<T, K> &
  Required<Pick<T, K>>;

/**
 * Make all properties nullable.
 */
export type Nullable<T> = { [K in keyof T]: T[K] | null };

/**
 * Make specific properties nullable.
 */
export type NullableBy<T, K extends keyof T> = Omit<T, K> & {
  [P in K]: T[P] | null;
};

/**
 * Deep partial - tất cả nested properties cũng optional.
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Deep readonly - tất cả nested properties cũng readonly.
 */
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends object ? DeepReadonly<T[P]> : T[P];
};

// ============================================================================
// FUNCTION TYPES
// ============================================================================

/**
 * Any async function.
 */
export type AsyncFunction<T = void> = (...args: any[]) => Promise<T>;

/**
 * Any function.
 */
export type AnyFunction = (...args: any[]) => any;

/**
 * Callback function with optional error.
 */
export type Callback<T = void> = (error: Error | null, result?: T) => void;

// ============================================================================
// OBJECT TYPES
// ============================================================================

/**
 * Plain object (không phải array, function, Date, etc.)
 */
export type PlainObject = Record<string, unknown>;

/**
 * Get keys of an object that have a specific value type.
 */
export type KeysOfType<T, V> = {
  [K in keyof T]: T[K] extends V ? K : never;
}[keyof T];

/**
 * Omit keys that have a specific value type.
 */
export type OmitByType<T, V> = Pick<T, KeysOfType<T, Exclude<T[keyof T], V>>>;

/**
 * Pick keys that have a specific value type.
 */
export type PickByType<T, V> = Pick<T, KeysOfType<T, V>>;

// ============================================================================
// ARRAY TYPES
// ============================================================================

/**
 * Get element type of an array.
 */
export type ArrayElement<T> = T extends readonly (infer U)[] ? U : never;

/**
 * Non-empty array.
 */
export type NonEmptyArray<T> = [T, ...T[]];

// ============================================================================
// STRING TYPES
// ============================================================================

/**
 * Non-empty string.
 */
export type NonEmptyString<T extends string> = T extends "" ? never : T;

/**
 * Lowercase string.
 */
export type LowercaseString<T extends string> = Lowercase<T>;

/**
 * Email string (branded type).
 */
export type Email = string & { readonly __brand: "email" };

/**
 * UUID string (branded type).
 */
export type UUID = string & { readonly __brand: "uuid" };

// Re-export common API types from centralized location
export * from "../types/api";

// ============================================================================
// COMPONENT TYPES
// ============================================================================

/**
 * Props với children bắt buộc.
 */
export interface WithChildren {
  children: React.ReactNode;
}

/**
 * Props với children optional.
 */
export interface WithOptionalChildren {
  children?: React.ReactNode;
}

/**
 * Props với className.
 */
export interface WithClassName {
  className?: string;
}

/**
 * Common component props.
 */
export interface CommonProps extends WithOptionalChildren, WithClassName {}

// ============================================================================
// UTILITY HELPERS
// ============================================================================

/**
 * Type-safe Object.keys
 */
export function typedKeys<T extends object>(obj: T): (keyof T)[] {
  return Object.keys(obj) as (keyof T)[];
}

/**
 * Type-safe Object.entries
 */
export function typedEntries<T extends object>(
  obj: T
): [keyof T, T[keyof T]][] {
  return Object.entries(obj) as [keyof T, T[keyof T]][];
}

/**
 * Assert value is defined (not null/undefined).
 */
export function assertDefined<T>(
  value: T | null | undefined,
  message = "Value is undefined"
): asserts value is T {
  if (value === null || value === undefined) {
    throw new Error(message);
  }
}

/**
 * Type guard for checking if value is not null/undefined.
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * Type guard for checking if value is an Error.
 */
export function isError(value: unknown): value is Error {
  return value instanceof Error;
}

/**
 * Type guard for checking if value is a plain object.
 */
export function isPlainObject(value: unknown): value is PlainObject {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    !(value instanceof Date) &&
    !(value instanceof RegExp)
  );
}
