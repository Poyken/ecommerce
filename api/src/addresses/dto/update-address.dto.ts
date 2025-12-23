import { PartialType } from '@nestjs/swagger';
import { CreateAddressDto } from './create-address.dto';

/**
 * =====================================================================
 * UPDATE ADDRESS DTO - Đối tượng cập nhật địa chỉ
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. DRY (Don't Repeat Yourself):
 * - Thay vì viết lại toàn bộ các trường của `CreateAddressDto`, ta sử dụng `PartialType`.
 * - `PartialType` sẽ biến tất cả các trường trong `CreateAddressDto` thành tùy chọn (`optional`).
 *
 * 2. FLEXIBILITY:
 * - Cho phép người dùng chỉ cập nhật một vài thông tin (VD: chỉ đổi số điện thoại) mà không cần gửi lại toàn bộ địa chỉ.
 * =====================================================================
 */

export class UpdateAddressDto extends PartialType(CreateAddressDto) {}
