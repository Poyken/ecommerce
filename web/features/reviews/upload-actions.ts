

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
