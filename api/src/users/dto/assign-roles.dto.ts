import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsString } from 'class-validator';

/**
 * =====================================================================
 * ASSIGN ROLES DTO - Đối tượng gán vai trò cho người dùng
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. ARRAY VALIDATION:
 * - `@IsArray()`: Đảm bảo dữ liệu gửi lên là một danh sách (mảng).
 * - `@ArrayNotEmpty()`: Không cho phép gửi mảng rỗng. Một người dùng ít nhất phải có một vai trò (hoặc ta muốn ép Admin phải chọn ít nhất 1).
 * - `@IsString({ each: true })`: Kiểm tra TỪNG phần tử trong mảng phải là chuỗi (String).
 *
 * 2. ROLE IDENTIFICATION:
 * - Mảng `roles` chứa danh sách các tên Role (VD: `['ADMIN', 'EDITOR']`).
 * - Backend sẽ dựa vào danh sách này để cập nhật bảng liên kết trong Database.
 * =====================================================================
 */

export class AssignRolesDto {
  @ApiProperty({ example: ['ADMIN', 'MANAGER'] })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  roles: string[];
}
