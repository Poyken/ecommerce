import { PartialType } from '@nestjs/swagger';
import { CreateSkuDto } from './create-sku.dto';

/**
 * =====================================================================
 * UPDATE SKU DTO - Đối tượng cập nhật biến thể sản phẩm
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. FLEXIBLE UPDATES:
 * - Sử dụng `PartialType` để cho phép cập nhật lẻ tẻ các trường (VD: Chỉ cập nhật giá, hoặc chỉ cập nhật số lượng tồn kho).
 *
 * 2. DATA CONSISTENCY:
 * - Kế thừa các quy tắc validation từ `CreateSkuDto` để đảm bảo dữ liệu cập nhật vẫn luôn hợp lệ (VD: Giá không được âm).
 * =====================================================================
 */

export class UpdateSkuDto extends PartialType(CreateSkuDto) {}
