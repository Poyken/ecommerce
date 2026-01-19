import { PartialType } from '@nestjs/swagger';
import { CreateCategoryDto } from './create-category.dto';

/**
 * =====================================================================
 * UPDATE CATEGORY DTO - Đối tượng cập nhật danh mục
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. REUSE VALIDATION:
 * - Sử dụng `PartialType` để kế thừa toàn bộ các quy tắc validation từ `CreateCategoryDto`.
 * - Giúp code ngắn gọn và dễ bảo trì (DRY - Don't Repeat Yourself).
 *
 * 2. OPTIONAL FIELDS:
 * - `PartialType` tự động biến tất cả các trường thành tùy chọn (`optional`).
 * - Phù hợp cho hành động PATCH, nơi ta chỉ muốn cập nhật một vài thông tin cụ thể (VD: chỉ đổi tên danh mục). *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Xử lý logic nghiệp vụ, phối hợp các service liên quan để hoàn thành yêu cầu từ Controller.

 * =====================================================================
 */

export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}
