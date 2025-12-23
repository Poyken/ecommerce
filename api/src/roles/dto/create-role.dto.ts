import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

/**
 * =====================================================================
 * CREATE ROLE DTO - Đối tượng tạo vai trò mới
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. ROLE IDENTIFICATION:
 * - `name`: Tên của vai trò (VD: `ADMIN`, `MANAGER`, `CUSTOMER`).
 * - Nên dùng chữ hoa (Uppercase) cho tên vai trò để dễ phân biệt với các dữ liệu khác.
 *
 * 2. VALIDATION:
 * - `@IsNotEmpty()`: Đảm bảo không tạo ra một vai trò không có tên.
 * =====================================================================
 */

export class CreateRoleDto {
  @ApiProperty({ example: 'EDITOR' })
  @IsString()
  @IsNotEmpty()
  name: string;
}
