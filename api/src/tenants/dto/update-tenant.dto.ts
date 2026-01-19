/**
 * =====================================================================
 * UPDATE-TENANT DTO (DATA TRANSFER OBJECT)
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
 *    - @ApiProperty(): Tài liệu Swagger *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Xử lý logic nghiệp vụ, phối hợp các service liên quan để hoàn thành yêu cầu từ Controller.

 * =====================================================================
 */

import { PartialType } from '@nestjs/swagger';
import { CreateTenantDto } from './create-tenant.dto';

export class UpdateTenantDto extends PartialType(CreateTenantDto) {}
