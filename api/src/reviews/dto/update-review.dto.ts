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
 * - Xử lý logic nghiệp vụ, phối hợp các service liên quan để hoàn thành yêu cầu từ Controller.

 * =====================================================================
 */

export class UpdateReviewDto extends PartialType(CreateReviewDto) {}
