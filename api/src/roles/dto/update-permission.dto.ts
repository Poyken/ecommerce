import { PartialType } from '@nestjs/swagger';
import { CreatePermissionDto } from './create-permission.dto';

/**
 * =====================================================================
 * UPDATE PERMISSION DTO - Đối tượng cập nhật quyền hạn
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. DYNAMIC UPDATES:
 * - Cho phép Admin thay đổi tên hoặc mô tả của một quyền hạn đã có.
 * - Sử dụng `PartialType` để giữ tính linh hoạt: Chỉ cần gửi lên những trường cần thay đổi. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Tiếp nhận request từ Client, điều phối xử lý và trả về response.

 * =====================================================================
 */

export class UpdatePermissionDto extends PartialType(CreatePermissionDto) {}
