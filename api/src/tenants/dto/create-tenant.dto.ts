/**
 * =====================================================================
 * CREATE-TENANT DTO (DATA TRANSFER OBJECT)
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * DTO định nghĩa cấu trúc dữ liệu truyền giữa các layer.
 *
 * 1. MỤC ĐÍCH:
 *    - Validate dữ liệu đầu vào
 *    - Định nghĩa kiểu dữ liệu cho request/response
 *    - Tách biệt dữ liệu API với database entity
 *
 * 2. DECORATORS SỬ DỤNG:
 *    - @IsString(), @IsNumber()...: Validate kiểu dữ liệu
 *    - @IsOptional(): Field không bắt buộc
 *    - @ApiProperty(): Tài liệu Swagger
 * =====================================================================
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateTenantDto {
  @ApiProperty({ example: 'Furniture Store' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'furniture.local' })
  @IsString()
  @IsNotEmpty()
  domain: string;

  @ApiProperty({
    example: 'BASIC',
    enum: ['BASIC', 'PRO', 'ENTERPRISE'],
  })
  @IsEnum(['BASIC', 'PRO', 'ENTERPRISE'])
  plan: 'BASIC' | 'PRO' | 'ENTERPRISE';

  @ApiPropertyOptional({ example: { primaryColor: '#000000' } })
  @IsObject()
  @IsOptional()
  themeConfig?: Record<string, any>;

  @ApiPropertyOptional({ example: 'admin@example.com' })
  @IsString()
  @IsOptional()
  adminEmail?: string;

  @ApiPropertyOptional({ example: 'password123' })
  @IsString()
  @IsOptional()
  adminPassword?: string;
}
