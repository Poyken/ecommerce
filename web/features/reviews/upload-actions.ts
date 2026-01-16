/**
 * =====================================================================
 * REVIEW IMAGES UPLOAD ACTION - Tải ảnh đánh giá
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * Action này chuyên biệt cho việc tải lên các hình ảnh đi kèm với đánh giá.
 * Tách riêng logic upload ảnh giúp tối ưu hóa việc xử lý file và
 * cho phép hiển thị preview ảnh trước khi user gửi đánh giá chính thức.
 *
 * QUY TRÌNH XỬ LÝ:
 * 1. Nhận FormData chứa các file ảnh.
 * 2. Gửi đến endpoint `/reviews/upload`.
 * 3. Nhận về danh sách URLs của các ảnh đã được lưu trữ trên server/cloud. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Dynamic Review UX: Cho phép khách hàng xem trước (preview) hình ảnh đánh giá ngay khi vừa chọn file, giúp tăng tỷ lệ hoàn tất đánh giá sản phẩm.
 * - Storage Efficiency: Tách biệt luồng upload ảnh giúp kiểm soát dung lượng và định dạng file chặt chẽ, tránh việc gửi trực tiếp file lớn vào Server Action chính gây chậm hệ thống.

 * =====================================================================
 */

"use server";

import { reviewService } from "./services/review.service";

/**
 * Tải lên các hình ảnh cho đánh giá sản phẩm.
 *
 * @param formData - FormData chứa các file ảnh (key: 'images')
 * @returns Danh sách URLs của các ảnh đã tải lên
 */
export async function uploadReviewImagesAction(formData: FormData) {
  try {
    const res = await reviewService.uploadImages(formData);
    return { urls: res.urls, success: true };
  } catch (error: unknown) {
    console.error("uploadReviewImagesAction error:", error);
    return { error: (error as Error).message, success: false };
  }
}
