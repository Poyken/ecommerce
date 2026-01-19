/**
 * =====================================================================
 * DTO HELPERS - Utilities cho Data Transfer Objects
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. DTO TRANSFORMATIONS:
 * - Các helpers để transform data từ database sang DTO format.
 * - Đảm bảo consistency và type safety.
 *
 * 2. COMMON PATTERNS:
 * - Pagination DTOs
 * - Filter DTOs
 * - Sort DTOs *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Xử lý logic nghiệp vụ, phối hợp các service liên quan để hoàn thành yêu cầu từ Controller.

 * =====================================================================
 */

import { ApiPropertyOptional } from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

// =============================================================================
// PAGINATION DTO
// =============================================================================

export const PaginationQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
});

export class PaginationQueryDto extends createZodDto(PaginationQuerySchema) {}

export const SearchQuerySchema = PaginationQuerySchema.extend({
  search: z.string().trim().optional().describe('Search keyword'),
});

export class SearchQueryDto extends createZodDto(SearchQuerySchema) {}

export const FullQuerySchema = SearchQuerySchema.extend({
  sort: z.string().optional().describe('Sort field'),
  order: z.enum(['asc', 'desc']).default('desc').describe('Sort order'),
});

export class FullQueryDto extends createZodDto(FullQuerySchema) {}

// =============================================================================
// DATE FILTER DTO
// =============================================================================

export const DateRangeSchema = z.object({
  startDate: z.string().optional().describe('Start date (ISO string)'),
  endDate: z.string().optional().describe('End date (ISO string)'),
});

export class DateRangeDto extends createZodDto(DateRangeSchema) {}

// =============================================================================
// PAGINATION RESPONSE TYPE
// =============================================================================

/**
 * Interface cho paginated response.
 */
export interface PaginatedResult<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    lastPage: number;
  };
}

/**
 * Helper function để tạo paginated response.
 */
export function createPaginatedResult<T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
): PaginatedResult<T> {
  return {
    data,
    meta: {
      total,
      page,
      limit,
      lastPage: Math.ceil(total / limit) || 1,
    },
  };
}

// =============================================================================
// DTO TRANSFORMATION HELPERS
// =============================================================================

/**
 * Transform empty string to undefined.
 * Sử dụng với @Transform decorator.
 */
export function emptyToUndefined(value: unknown): unknown {
  if (value === '' || value === null) {
    return undefined;
  }
  return value;
}

/**
 * Transform string 'true'/'false' to boolean.
 */
export function stringToBoolean(value: unknown): boolean | undefined {
  if (value === 'true' || value === '1') return true;
  if (value === 'false' || value === '0') return false;
  if (typeof value === 'boolean') return value;
  return undefined;
}

/**
 * Transform comma-separated string to array.
 */
export function commaSeparatedToArray(value: unknown): string[] | undefined {
  if (!value) return undefined;
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return undefined;
}

// =============================================================================
// VALIDATION HELPERS
// =============================================================================

/**
 * Check if string is valid UUID.
 */
export function isValidUUID(str: string): boolean {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}

/**
 * Check if string is valid email.
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Check if string is valid Vietnamese phone number.
 */
export function isValidPhoneVN(phone: string): boolean {
  const phoneRegex = /^(0[3|5|7|8|9])+([0-9]{8})$/;
  return phoneRegex.test(phone);
}

// =============================================================================
// ENTITY TO DTO MAPPER
// =============================================================================

/**
 * Pick only specific fields from entity.
 * Giúp tránh expose các fields nhạy cảm.
 *
 * @example
 * const userDto = pick(user, ['id', 'name', 'email']);
 */
export function pick<T extends object, K extends keyof T>(
  obj: T,
  keys: K[],
): Pick<T, K> {
  const result = {} as Pick<T, K>;
  for (const key of keys) {
    if (key in obj) {
      result[key] = obj[key];
    }
  }
  return result;
}

/**
 * Omit specific fields from entity.
 *
 * @example
 * const userDto = omit(user, ['password', 'refreshToken']);
 */
export function omit<T extends object, K extends keyof T>(
  obj: T,
  keys: K[],
): Omit<T, K> {
  const result = { ...obj };
  for (const key of keys) {
    delete result[key];
  }
  return result;
}
