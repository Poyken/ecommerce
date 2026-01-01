"use server";

import { http } from "@/lib/http";

/**
 * =====================================================================
 * REVIEW UPLOAD ACTION
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * - Upload ảnh review là một quy trình đặc biệt vì nó dùng `FormData` (multipart/form-data).
 * - Action này forward nguyên `FormData` nhận được từ Client tới Backend API.
 * - Backend sẽ xử lý việc upload lên Cloudinary.
 * =====================================================================
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
