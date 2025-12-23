import { PartialType } from '@nestjs/swagger';
import { CreateUserDto } from './create-user.dto';

/**
 * =====================================================================
 * UPDATE USER DTO - Đối tượng cập nhật thông tin người dùng
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. REUSE VALIDATION:
 * - Sử dụng `PartialType` để kế thừa toàn bộ các quy tắc validation từ `CreateUserDto`.
 * - Giúp code ngắn gọn và dễ bảo trì (DRY - Don't Repeat Yourself).
 *
 * 2. OPTIONAL FIELDS:
 * - `PartialType` tự động biến tất cả các trường thành tùy chọn (`optional`).
 * - Phù hợp cho hành động PATCH, nơi Admin chỉ muốn cập nhật một vài thông tin cụ thể (VD: chỉ đổi họ tên mà không đổi mật khẩu).
 * =====================================================================
 */

export class UpdateUserDto extends PartialType(CreateUserDto) {}
