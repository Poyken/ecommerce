import { PartialType } from '@nestjs/mapped-types';
import { CreateReviewDto } from './create-review.dto';

/**
 * =====================================================================
 * UPDATE REVIEW DTO - Đối tượng cập nhật đánh giá
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. EDITABLE CONTENT:
 * - Cho phép người dùng sửa lại nội dung hoặc số sao đã đánh giá nếu họ thay đổi ý định.
 * - Sử dụng `PartialType` để kế thừa các quy tắc validation từ `CreateReviewDto`. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Tiếp nhận request từ Client, điều phối xử lý và trả về response.

 * =====================================================================
 */

export class UpdateReviewDto extends PartialType(CreateReviewDto) {}
