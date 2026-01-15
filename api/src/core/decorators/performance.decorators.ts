/**
 * =====================================================================
 * PERFORMANCE DECORATORS - ĐO LƯỜNG VÀ TỐI ƯU HIỆU SUẤT
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * Các decorators này giúp đo lường và tối ưu hiệu suất tự động:
 * 1. @LogExecutionTime: Ghi log thời gian thực thi
 * 2. @Cacheable: Cache kết quả tự động
 * 3. @Retry: Tự động retry khi lỗi
 * 4. @RateLimit: Giới hạn số lần gọi
 *
 * =====================================================================
 */

import { Logger } from '@nestjs/common';

const logger = new Logger('PerformanceDecorator');

/**
 * Decorator ghi log thời gian thực thi method
 */
export function LogExecutionTime(threshold = 100) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const start = performance.now();
      const className = target.constructor.name;

      try {
        const result = await originalMethod.apply(this, args);
        const duration = performance.now() - start;

        if (duration > threshold) {
          logger.warn(
            `⚠️ SLOW: ${className}.${propertyKey} took ${duration.toFixed(2)}ms`,
          );
        } else {
          logger.debug(
            `${className}.${propertyKey} completed in ${duration.toFixed(2)}ms`,
          );
        }

        return result;
      } catch (error) {
        const duration = performance.now() - start;
        logger.error(
          `${className}.${propertyKey} FAILED after ${duration.toFixed(2)}ms`,
        );
        throw error;
      }
    };

    return descriptor;
  };
}

/**
 * Decorator tự động retry khi gặp lỗi
 */
export function Retry(maxAttempts = 3, delayMs = 100) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const className = target.constructor.name;
      let lastError: Error;

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          return await originalMethod.apply(this, args);
        } catch (error) {
          lastError = error as Error;
          logger.warn(
            `${className}.${propertyKey} attempt ${attempt}/${maxAttempts} failed: ${lastError.message}`,
          );

          if (attempt < maxAttempts) {
            await new Promise((resolve) =>
              setTimeout(resolve, delayMs * attempt),
            );
          }
        }
      }

      logger.error(
        `${className}.${propertyKey} failed after ${maxAttempts} attempts`,
      );
      throw lastError!;
    };

    return descriptor;
  };
}

/**
 * Decorator để memoize kết quả trong memory (cho các hàm pure)
 */
export function Memoize(ttlSeconds = 60) {
  const cache = new Map<string, { value: any; expiry: number }>();

  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const key = JSON.stringify(args);
      const cached = cache.get(key);

      if (cached && cached.expiry > Date.now()) {
        return cached.value;
      }

      const result = await originalMethod.apply(this, args);
      cache.set(key, {
        value: result,
        expiry: Date.now() + ttlSeconds * 1000,
      });

      // Cleanup expired entries periodically
      if (cache.size > 1000) {
        const now = Date.now();
        for (const [k, v] of cache.entries()) {
          if (v.expiry < now) cache.delete(k);
        }
      }

      return result;
    };

    return descriptor;
  };
}

/**
 * Decorator đảm bảo method chỉ được gọi một lần tại một thời điểm
 */
export function SingleFlight() {
  const inFlight = new Map<string, Promise<any>>();

  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const key = JSON.stringify(args);

      // If there's already a request in flight with same args, wait for it
      if (inFlight.has(key)) {
        return inFlight.get(key);
      }

      // Start new request
      const promise = originalMethod.apply(this, args).finally(() => {
        inFlight.delete(key);
      });

      inFlight.set(key, promise);
      return promise;
    };

    return descriptor;
  };
}

/**
 * Decorator để debounce method calls
 */
export function Debounce(delayMs = 300) {
  let timeoutId: NodeJS.Timeout | null = null;

  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = function (...args: any[]) {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      return new Promise((resolve) => {
        timeoutId = setTimeout(async () => {
          const result = await originalMethod.apply(this, args);
          resolve(result);
        }, delayMs);
      });
    };

    return descriptor;
  };
}

/**
 * Performance metrics collector utility
 */
export class PerformanceMetrics {
  private static metrics = new Map<
    string,
    {
      count: number;
      totalTime: number;
      minTime: number;
      maxTime: number;
      errors: number;
    }
  >();

  static record(name: string, duration: number, isError = false) {
    const existing = this.metrics.get(name) || {
      count: 0,
      totalTime: 0,
      minTime: Infinity,
      maxTime: 0,
      errors: 0,
    };

    existing.count++;
    existing.totalTime += duration;
    existing.minTime = Math.min(existing.minTime, duration);
    existing.maxTime = Math.max(existing.maxTime, duration);
    if (isError) existing.errors++;

    this.metrics.set(name, existing);
  }

  static getStats(name: string) {
    const m = this.metrics.get(name);
    if (!m) return null;

    return {
      name,
      count: m.count,
      avgTime: m.totalTime / m.count,
      minTime: m.minTime,
      maxTime: m.maxTime,
      errors: m.errors,
      errorRate: m.errors / m.count,
    };
  }

  static getAllStats() {
    return Array.from(this.metrics.keys()).map((name) => this.getStats(name));
  }

  static reset() {
    this.metrics.clear();
  }
}
