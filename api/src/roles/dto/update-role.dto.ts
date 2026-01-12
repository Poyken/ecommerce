import { PartialType } from '@nestjs/swagger';
import { CreateRoleDto } from './create-role.dto';

/**
 * =====================================================================
 * UPDATE ROLE DTO - Đối tượng cập nhật vai trò
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. REUSE LOGIC:
 * - Sử dụng `PartialType` để kế thừa toàn bộ các trường từ `CreateRoleDto`.
 * - Giúp code ngắn gọn và dễ bảo trì: Khi `CreateRoleDto` thay đổi, `UpdateRoleDto` sẽ tự động cập nhật theo.
 *
 * 2. OPTIONAL FIELDS:
 * - Tất cả các trường kế thừa đều trở thành tùy chọn, cho phép cập nhật từng phần (Patch) thông tin vai trò. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Tiếp nhận request từ Client, điều phối xử lý và trả về response.

 * =====================================================================
 */

export class UpdateRoleDto extends PartialType(CreateRoleDto) {}
