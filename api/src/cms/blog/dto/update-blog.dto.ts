import { PartialType } from '@nestjs/swagger';
import { CreateBlogDto } from './create-blog.dto';

/**
 * =====================================================================
 * UPDATE BLOG DTO - Dữ liệu cập nhật bài viết
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. PARTIAL TYPE (Mapped Types):
 * - Thay vì copy lại toàn bộ các trường từ `CreateBlogDto` và thêm `?` (optional) vào từng cái,
 *   NestJS cung cấp `PartialType`.
 * - Nó tự động tạo ra một class mới kế thừa từ class cũ, nhưng biến TẤT CẢ các trường thành Optional.
 * - Rất tiện lợi và giúp code không bị lặp lại (DRY - Don't Repeat Yourself). *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Xử lý logic nghiệp vụ, phối hợp các service liên quan để hoàn thành yêu cầu từ Controller.

 * =====================================================================
 */
export class UpdateBlogDto extends PartialType(CreateBlogDto) {}
