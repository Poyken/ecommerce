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
 * - Đóng vai trò quan trọng trong kiến trúc hệ thống, hỗ trợ các chức năng nghiệp vụ cụ thể.

 * =====================================================================
 */

"use server";

import { http } from "@/lib/http";

/**
 * Tải lên các hình ảnh cho đánh giá sản phẩm.
 *
 * @param formData - FormData chứa các file ảnh (key: 'images')
 * @returns Danh sách URLs của các ảnh đã tải lên
 */
export async function uploadReviewImagesAction(formData: FormData) {
  try {
    const res = await http<{ urls: string[] }>("/reviews/upload", {
      method: "POST",
      body: formData,
    });
    return { urls: res.urls, success: true };
  } catch (error: unknown) {
    console.error("uploadReviewImagesAction error:", error);
    return { error: (error as Error).message, success: false };
  }
}
