import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

/**
 * =====================================================================
 * CREATE PERMISSION DTO - Đối tượng tạo quyền hạn mới
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. NAMING CONVENTION (Quy ước đặt tên):
 * - Quyền hạn nên được đặt theo định dạng `resource:action` (VD: `product:create`, `order:read`).
 * - Giúp việc quản lý và kiểm tra quyền trong code trở nên hệ thống và dễ hiểu.
 *
 * 2. GRANULARITY (Độ chi tiết):
 * - Mỗi Permission nên đại diện cho một hành động duy nhất trên một tài nguyên duy nhất. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Tiếp nhận request từ Client, điều phối xử lý và trả về response.

 * =====================================================================
 */

export class CreatePermissionDto {
  @ApiProperty({
    description: 'Permission name in format resource:action',
    example: 'product:create',
  })
  @IsNotEmpty()
  @IsString()
  name: string;
}
