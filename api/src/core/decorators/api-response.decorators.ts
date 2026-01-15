/**
 * =====================================================================
 * API RESPONSE DECORATORS - SWAGGER DOCUMENTATION HELPERS
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * Các decorator này giúp tạo Swagger documentation tự động và nhất quán:
 * 1. @ApiPaginatedResponse: Mô tả response có pagination
 * 2. @ApiErrorResponses: Thêm các error responses phổ biến
 * 3. @ApiAuthRequired: Đánh dấu endpoint cần authentication
 *
 * =====================================================================
 */

import { applyDecorators, Type } from '@nestjs/common';
import {
  ApiExtraModels,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiInternalServerErrorResponse,
  getSchemaPath,
  ApiProperty,
  ApiBearerAuth,
  ApiOperation,
} from '@nestjs/swagger';

// =====================================================================
// RESPONSE SCHEMAS
// =====================================================================

export class PaginationMeta {
  @ApiProperty({ example: 100 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  limit: number;

  @ApiProperty({ example: 5 })
  lastPage: number;

  @ApiProperty({ example: true })
  hasNextPage: boolean;

  @ApiProperty({ example: false })
  hasPrevPage: boolean;
}

export class StandardResponse<T> {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty()
  data: T;

  @ApiProperty({ example: 'Operation completed successfully' })
  message?: string;
}

export class ErrorResponse {
  @ApiProperty({ example: false })
  success: boolean;

  @ApiProperty({ example: 'Error message' })
  message: string;

  @ApiProperty({ example: 'ERROR_CODE' })
  code?: string;

  @ApiProperty({ example: { field: 'error detail' } })
  errors?: Record<string, any>;
}

// =====================================================================
// DECORATORS
// =====================================================================

/**
 * Decorator cho paginated response
 * @param model - DTO class của item trong list
 */
export function ApiPaginatedResponse<TModel extends Type<any>>(model: TModel) {
  return applyDecorators(
    ApiExtraModels(PaginationMeta),
    ApiExtraModels(model),
    ApiOkResponse({
      description: 'Paginated response',
      schema: {
        allOf: [
          {
            properties: {
              success: { type: 'boolean', example: true },
              data: {
                type: 'array',
                items: { $ref: getSchemaPath(model) },
              },
              meta: { $ref: getSchemaPath(PaginationMeta) },
            },
          },
        ],
      },
    }),
  );
}

/**
 * Decorator cho standard single item response
 */
export function ApiStandardResponse<TModel extends Type<any>>(
  model: TModel,
  description = 'Success response',
) {
  return applyDecorators(
    ApiExtraModels(model),
    ApiOkResponse({
      description,
      schema: {
        properties: {
          success: { type: 'boolean', example: true },
          data: { $ref: getSchemaPath(model) },
          message: { type: 'string', example: 'Operation successful' },
        },
      },
    }),
  );
}

/**
 * Decorator thêm các error responses phổ biến
 */
export function ApiErrorResponses() {
  return applyDecorators(
    ApiBadRequestResponse({
      description: 'Bad Request - Invalid input data',
      type: ErrorResponse,
    }),
    ApiUnauthorizedResponse({
      description: 'Unauthorized - Authentication required',
      type: ErrorResponse,
    }),
    ApiForbiddenResponse({
      description: 'Forbidden - Insufficient permissions',
      type: ErrorResponse,
    }),
    ApiNotFoundResponse({
      description: 'Not Found - Resource does not exist',
      type: ErrorResponse,
    }),
    ApiInternalServerErrorResponse({
      description: 'Internal Server Error',
      type: ErrorResponse,
    }),
  );
}

/**
 * Decorator đầy đủ cho protected endpoints
 */
export function ApiAuthRequired(summary: string, description?: string) {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary, description }),
    ApiUnauthorizedResponse({
      description: 'Authentication required',
    }),
    ApiForbiddenResponse({
      description: 'Insufficient permissions',
    }),
  );
}

/**
 * Decorator cho public endpoints
 */
export function ApiPublic(summary: string, description?: string) {
  return applyDecorators(ApiOperation({ summary, description }));
}

/**
 * Decorator cho admin-only endpoints
 */
export function ApiAdminOnly(summary: string) {
  return applyDecorators(
    ApiBearerAuth(),
    ApiOperation({ summary, description: 'Chỉ dành cho Admin' }),
    ApiUnauthorizedResponse({ description: 'Authentication required' }),
    ApiForbiddenResponse({ description: 'Admin access required' }),
  );
}

/**
 * Decorator cho CRUD endpoints
 */
export const ApiCrud = {
  create: (modelName: string) =>
    ApiOperation({
      summary: `Create a new ${modelName}`,
      description: `Creates a new ${modelName} record`,
    }),

  findAll: (modelName: string) =>
    ApiOperation({
      summary: `Get all ${modelName}s`,
      description: `Returns a paginated list of ${modelName}s`,
    }),

  findOne: (modelName: string) =>
    ApiOperation({
      summary: `Get ${modelName} by ID`,
      description: `Returns a single ${modelName} by its ID`,
    }),

  update: (modelName: string) =>
    ApiOperation({
      summary: `Update ${modelName}`,
      description: `Updates an existing ${modelName} record`,
    }),

  delete: (modelName: string) =>
    ApiOperation({
      summary: `Delete ${modelName}`,
      description: `Deletes a ${modelName} record (soft delete)`,
    }),
};
