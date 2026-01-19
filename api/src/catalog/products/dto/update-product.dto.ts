import { createZodDto } from 'nestjs-zod';
import { CreateProductSchema } from './create-product.dto';

/**
 * =====================================================================
 * UPDATE PRODUCT DTO - Đối tượng cập nhật sản phẩm
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. PARTIAL UPDATES:
 * - `CreateProductSchema.partial()`: Biến tất cả các trường từ schema tạo mới thành tùy chọn.
 * - Cho phép Admin chỉ cập nhật một vài thông tin (VD: chỉ đổi tên sản phẩm) mà không cần gửi lại toàn bộ dữ liệu.
 *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Xử lý logic nghiệp vụ, phối hợp các service liên quan để hoàn thành yêu cầu từ Controller.

 * =====================================================================
 */

const UpdateProductSchema = CreateProductSchema.partial();

export class UpdateProductDto extends createZodDto(UpdateProductSchema) {}
