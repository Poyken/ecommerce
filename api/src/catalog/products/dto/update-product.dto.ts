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
 * - Tiếp nhận request từ Client, điều phối xử lý và trả về response.

 * =====================================================================
 */

const UpdateProductSchema = CreateProductSchema.partial();

export class UpdateProductDto extends createZodDto(UpdateProductSchema) {}
