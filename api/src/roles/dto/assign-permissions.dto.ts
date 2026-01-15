import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsString } from 'class-validator';

/**
 * =====================================================================
 * ASSIGN PERMISSIONS DTO - Đối tượng gán quyền cho vai trò
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. ARRAY VALIDATION:
 * - `@IsArray()`: Đảm bảo dữ liệu gửi lên là một danh sách.
 * - `@ArrayNotEmpty()`: Không cho phép gán một danh sách trống (nếu muốn xóa hết quyền, cần có logic riêng hoặc chấp nhận mảng trống tùy yêu cầu).
 * - `@IsString({ each: true })`: Kiểm tra từng phần tử trong mảng phải là chuỗi (ID của Permission).
 *
 * 2. BATCH PROCESSING:
 * - DTO này cho phép gán nhiều quyền cùng lúc, giúp giảm số lượng request lên server. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Tiếp nhận request từ Client, điều phối xử lý và trả về response.

 * =====================================================================
 */

export class AssignPermissionsDto {
  @ApiProperty({ example: ['user:read', 'product:create'] })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  permissions: string[];
}
