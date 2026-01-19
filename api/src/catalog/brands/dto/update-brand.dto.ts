import { PartialType } from '@nestjs/swagger';
import { CreateBrandDto } from './create-brand.dto';

/**
 * =====================================================================
 * UPDATE BRAND DTO - Đối tượng cập nhật thương hiệu
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. REUSE VALIDATION:
 * - Sử dụng `PartialType` để kế thừa toàn bộ các quy tắc validation từ `CreateBrandDto`.
 * - Giúp code ngắn gọn và dễ bảo trì (DRY - Don't Repeat Yourself).
 *
 * 2. OPTIONAL FIELDS:
 * - `PartialType` tự động biến tất cả các trường thành tùy chọn (`optional`).
 * - Phù hợp cho hành động PATCH, nơi ta chỉ muốn cập nhật một vài thông tin cụ thể. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Xử lý logic nghiệp vụ, phối hợp các service liên quan để hoàn thành yêu cầu từ Controller.

 * =====================================================================
 */

export class UpdateBrandDto extends PartialType(CreateBrandDto) {}
