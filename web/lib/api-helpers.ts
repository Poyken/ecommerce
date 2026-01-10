/**
 * =====================================================================
 * API HELPERS - Hàm tiện ích cho API calls
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. RETRY LOGIC:
 * - Khi gọi API, mạng có thể không ổn định.
 * - Thay vì fail ngay, ta retry vài lần với exponential backoff.
 *
 * 2. TIMEOUT HANDLING:
 * - Fetch API mặc định không có timeout.
 * - Ta wrap lại với AbortController để cancel request sau một thời gian.
 *
 * 3. CACHE HELPERS:
 * - Các helper để tạo Next.js cache options một cách consistent.
 * =====================================================================
 */

import { API_CONFIG } from "./constants";
import { getErrorMessage, isTimeoutError, isNetworkError } from "./error-utils";

// ============================================================================
// RETRY WITH EXPONENTIAL BACKOFF
// ============================================================================

/**
 * Options cho retry function.
 */
interface RetryOptions {
  /** Số lần retry tối đa */
  maxRetries?: number;
  /** Delay ban đầu (ms) */
  initialDelay?: number;
  /** Hệ số nhân delay sau mỗi lần retry */
  backoffMultiplier?: number;
  /** Các status code mà ta sẽ retry */
  retryOnStatus?: number[];
}

/**
 * Wrap một hàm async với retry logic.
 * Sử dụng exponential backoff để tránh spam server.
 *
 * @param fn - Hàm async cần retry
 * @param options - Cấu hình retry
 * @returns Kết quả của hàm fn
 *
 * @example
 * const data = await withRetry(
 *   () => fetch("/api/data"),
 *   { maxRetries: 3 }
 * );
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = API_CONFIG.MAX_RETRIES,
    initialDelay = API_CONFIG.RETRY_DELAY,
    backoffMultiplier = 2,
    retryOnStatus = [408, 429, 500, 502, 503, 504],
  } = options;

  let lastError: Error | null = null;
  let delay = initialDelay;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Kiểm tra xem có nên retry không
      const status = (error as any)?.status;
      const shouldRetry =
        attempt < maxRetries && (!status || retryOnStatus.includes(status));

      if (!shouldRetry) {
        throw error;
      }

      // Log retry
      console.warn(
        `[Retry] Attempt ${
          attempt + 1
        }/${maxRetries} failed. Retrying in ${delay}ms...`,
        { error: (error as Error).message }
      );

      // Wait với exponential backoff
      await sleep(delay);
      delay *= backoffMultiplier;
    }
  }

  throw lastError;
}

// ============================================================================
// TIMEOUT WRAPPER
// ============================================================================

/**
 * Wrap một promise với timeout.
 * Nếu promise không resolve trong thời gian quy định, sẽ throw TimeoutError.
 *
 * @param promise - Promise cần wrap
 * @param timeoutMs - Thời gian timeout (ms)
 * @returns Promise result hoặc throw TimeoutError
 */
export async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = API_CONFIG.DEFAULT_TIMEOUT
): Promise<T> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error(`Request timeout after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]);
}

/**
 * Tạo fetch request với timeout sử dụng AbortController.
 * Đây là cách đúng để cancel fetch request.
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs: number = API_CONFIG.DEFAULT_TIMEOUT
): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(id);
  }
}

// ============================================================================
// CACHE OPTIONS HELPERS
// ============================================================================

/**
 * Tạo Next.js cache config cho fetch.
 */
export function cacheFor(seconds: number): { next: { revalidate: number } } {
  return { next: { revalidate: seconds } };
}

/**
 * Tạo cache config với tags để revalidate.
 */
export function cacheWithTags(
  seconds: number,
  tags: string[]
): { next: { revalidate: number; tags: string[] } } {
  return { next: { revalidate: seconds, tags } };
}

/**
 * Không cache (dynamic data).
 */
export const noCache = { next: { revalidate: 0 } };

/**
 * Cache mãi mãi (static data).
 */
export const cacheForever = { next: { revalidate: false as const } };

// ============================================================================
// URL HELPERS
// ============================================================================

/**
 * Build URL với query parameters.
 * Tự động encode và bỏ qua các giá trị undefined/null.
 */
export function buildUrl(
  baseUrl: string,
  params?: Record<string, string | number | boolean | undefined | null>
): string {
  if (!params) return baseUrl;

  const url = new URL(baseUrl, "http://dummy"); // dummy base để xử lý relative URL

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.append(key, String(value));
    }
  });

  // Trả về chỉ phần path + query
  return `${url.pathname}${url.search}`;
}

/**
 * Chuẩn hóa tham số phân trang.
 * Hỗ trợ cả object hoặc tham số rời rạc.
 */
export function normalizePaginationParams(
  paramsOrPage?: any,
  limit?: number,
  search?: string
): Record<string, any> {
  if (
    typeof paramsOrPage === "object" &&
    paramsOrPage !== null &&
    !Array.isArray(paramsOrPage)
  ) {
    return paramsOrPage;
  }
  const params: Record<string, any> = {};
  if (paramsOrPage !== undefined) params.page = paramsOrPage;
  if (limit !== undefined) params.limit = limit;
  if (search !== undefined) params.search = search;
  return params;
}

/**
 * Parse query string thành object.
 */
export function parseQueryString(
  queryString: string
): Record<string, string | string[]> {
  const params = new URLSearchParams(queryString);
  const result: Record<string, string | string[]> = {};

  params.forEach((value, key) => {
    const existing = result[key];
    if (existing) {
      result[key] = Array.isArray(existing)
        ? [...existing, value]
        : [existing, value];
    } else {
      result[key] = value;
    }
  });

  return result;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Sleep function cho async/await.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Debounce function helper (không phải hook).
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Throttle function helper.
 */
export function throttle<T extends (...args: any[]) => any>(
  fn: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

/**
 * Kiểm tra xem error có phải network error không.
 */
export { isNetworkError };

/**
 * Kiểm tra xem error có phải timeout không.
 */
export { isTimeoutError };

/**
 * Extract error message từ unknown error.
 */
export { getErrorMessage };
