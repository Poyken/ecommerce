/**
 * =====================================================================
 * RESULT TYPE - Error Handling Pattern
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. RESULT PATTERN:
 * - Thay vì throw error và try-catch khắp nơi, ta trả về object { success, data, error }.
 * - Giúp TypeScript hiểu rõ cả success case và error case.
 * - Inspired by Rust's Result type và Go's multiple return values.
 *
 * 2. TẠI SAO KHÔNG DÙNG TRY-CATCH?
 * - try-catch dễ bỏ sót (quên catch).
 * - Error không được type-check (luôn là unknown).
 * - Result pattern ép buộc developer xử lý cả 2 trường hợp.
 * =====================================================================
 */

// ============================================================================
// RESULT TYPE DEFINITIONS
// ============================================================================

/**
 * Kết quả thành công.
 */
export type Success<T> = {
  success: true;
  data: T;
  error?: never;
};

/**
 * Kết quả thất bại.
 */
export type Failure<E = Error> = {
  success: false;
  data?: never;
  error: E;
};

/**
 * Union type cho Result (thành công hoặc thất bại).
 */
export type Result<T, E = Error> = Success<T> | Failure<E>;

// ============================================================================
// RESULT CONSTRUCTORS
// ============================================================================

/**
 * Tạo Result thành công.
 */
export function ok<T>(data: T): Success<T> {
  return { success: true, data };
}

/**
 * Tạo Result thất bại.
 */
export function err<E = Error>(error: E): Failure<E> {
  return { success: false, error };
}

// ============================================================================
// RESULT UTILITIES
// ============================================================================

/**
 * Kiểm tra Result có phải success không (type guard).
 */
export function isOk<T, E>(result: Result<T, E>): result is Success<T> {
  return result.success === true;
}

/**
 * Kiểm tra Result có phải error không (type guard).
 */
export function isErr<T, E>(result: Result<T, E>): result is Failure<E> {
  return result.success === false;
}

/**
 * Unwrap data từ Result. Throw nếu là error.
 */
export function unwrap<T, E>(result: Result<T, E>): T {
  if (isOk(result)) {
    return result.data;
  }
  throw result.error;
}

/**
 * Unwrap data từ Result với default value nếu error.
 */
export function unwrapOr<T, E>(result: Result<T, E>, defaultValue: T): T {
  if (isOk(result)) {
    return result.data;
  }
  return defaultValue;
}

/**
 * Transform data trong Result (nếu success).
 */
export function map<T, U, E>(
  result: Result<T, E>,
  fn: (data: T) => U
): Result<U, E> {
  if (isOk(result)) {
    return ok(fn(result.data));
  }
  return result;
}

/**
 * Transform error trong Result (nếu failure).
 */
export function mapErr<T, E, F>(
  result: Result<T, E>,
  fn: (error: E) => F
): Result<T, F> {
  if (isErr(result)) {
    return err(fn(result.error));
  }
  return result as unknown as Result<T, F>;
}

// ============================================================================
// ASYNC RESULT HELPERS
// ============================================================================

/**
 * Wrap một async function thành Result.
 * Tự động bắt error và trả về Result thay vì throw.
 *
 * @example
 * const result = await tryCatch(() => fetch('/api/data'));
 * if (result.success) {
 *   console.log(result.data);
 * } else {
 *   console.error(result.error);
 * }
 */
import { getErrorMessage } from "./error-utils";

export async function tryCatch<T>(
  fn: () => Promise<T>
): Promise<Result<T, Error>> {
  try {
    const data = await fn();
    return ok(data);
  } catch (error) {
    const message = getErrorMessage(error);
    return err(new Error(message));
  }
}

/**
 * Wrap một sync function thành Result.
 */
export function tryCatchSync<T>(fn: () => T): Result<T, Error> {
  try {
    const data = fn();
    return ok(data);
  } catch (error) {
    return err(error instanceof Error ? error : new Error(String(error)));
  }
}

// ============================================================================
// API RESPONSE RESULT
// ============================================================================

/**
 * Định nghĩa lỗi API chuẩn.
 */
export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  details?: Record<string, unknown>;
}

/**
 * Result type cho API responses.
 */
export type ApiResult<T> = Result<T, ApiError>;

/**
 * Tạo API error từ HTTP response.
 */
export function createApiError(
  message: string,
  status?: number,
  code?: string
): ApiError {
  return { message, status, code };
}

/**
 * Xử lý response từ API và trả về Result.
 */
export async function handleApiResponse<T>(
  responsePromise: Promise<T>
): Promise<ApiResult<T>> {
  try {
    const data = await responsePromise;
    return ok(data);
  } catch (error) {
    if (error instanceof Error) {
      const apiError: ApiError = {
        message: error.message,
        status: (error as any).status,
        code: (error as any).code,
      };
      return err(apiError);
    }
    return err({ message: "Unknown error occurred" });
  }
}

// ============================================================================
// VALIDATION RESULT
// ============================================================================

/**
 * Validation error với chi tiết từng field.
 */
export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Result type cho validation.
 */
export type ValidationResult<T> = Result<T, ValidationError[]>;

/**
 * Tạo validation error.
 */
export function validationErr(
  field: string,
  message: string
): Failure<ValidationError[]> {
  return err([{ field, message }]);
}

/**
 * Combine nhiều validation results.
 */
export function combineValidations<T>(
  results: ValidationResult<unknown>[],
  finalData: T
): ValidationResult<T> {
  const errors: ValidationError[] = [];

  for (const result of results) {
    if (isErr(result)) {
      errors.push(...result.error);
    }
  }

  if (errors.length > 0) {
    return err(errors);
  }

  return ok(finalData);
}
