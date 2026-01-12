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
 * - Tiếp nhận request từ Client, điều phối xử lý và trả về response.

 * =====================================================================
 */

import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

// =============================================================================
// PAGINATION DTO
// =============================================================================

/**
 * Base DTO cho pagination queries.
 * Extend class này để thêm các filter fields khác.
 *
 * @example
 * class GetProductsDto extends PaginationQueryDto {
 *   @IsOptional()
 *   @IsString()
 *   categoryId?: string;
 * }
 */
export class PaginationQueryDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 10, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}

/**
 * Pagination DTO với search.
 */
export class SearchQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ description: 'Search keyword' })
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  search?: string;
}

/**
 * Full query DTO với search và sort.
 */
export class FullQueryDto extends SearchQueryDto {
  @ApiPropertyOptional({ description: 'Sort field', example: 'createdAt' })
  @IsOptional()
  @IsString()
  sort?: string;

  @ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  order?: 'asc' | 'desc' = 'desc';
}

// =============================================================================
// DATE FILTER DTO
// =============================================================================

/**
 * DTO cho date range filtering.
 */
export class DateRangeDto {
  @ApiPropertyOptional({ description: 'Start date (ISO string)' })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date (ISO string)' })
  @IsOptional()
  @IsString()
  endDate?: string;
}

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
