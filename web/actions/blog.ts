"use server";
import { http } from "@/lib/http";
import { ActionResult } from "@/types/dtos";
import { revalidatePath } from "next/cache";

/**
 * =====================================================================
 * BLOG ACTIONS - Quản lý bài viết (Server Actions)
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. UNIFIED PAYLOAD HANDLING (Xử lý đa dạng đầu vào):
 * - Hàm `create` và `update` hỗ trợ cả JSON Object và FormData.
 * - Điều này giúp linh hoạt: Dùng form HTML native cũng được, dùng React Hook Form cũng xong.
 * - `isFormData` check giúp xác định cách gửi body cho API.
 *
 * 2. CACHE REVALIDATION:
 * - `revalidatePath("/admin/blogs")`: Làm mới danh sách trong trang Admin để thấy bài vừa tạo/sửa ngay.
 * - `revalidatePath("/blog")`: Làm mới trang chủ Blog phía người dùng.
 * - Nếu không có dòng này, Admin sửa xong F5 lại vẫn thấy dữ liệu cũ (do cache).
 * =====================================================================
 */

export async function createBlogAction(
  data:
    | {
        title: string;
        slug: string;
        excerpt: string;
        content: string;
        category: string;
        author: string;
        language: string;
        readTime: string;
        image: string;
        productIds: string[];
      }
    | FormData
): Promise<ActionResult> {
  try {
    const isFormData = data instanceof FormData;
    await http("/blogs", {
      method: "POST",
      body: isFormData ? data : JSON.stringify(data),
    });

    revalidatePath("/admin/blogs");
    revalidatePath("/blog");

    return { success: true };
  } catch (error: unknown) {
    console.error("Error creating blog:", error);
    return { error: (error as Error).message || "Failed to create blog post" };
  }
}

export async function updateBlogAction(
  id: string,
  data:
    | {
        title: string;
        slug: string;
        excerpt: string;
        content: string;
        category: string;
        author: string;
        language: string;
        readTime: string;
        image: string;
        productIds: string[];
      }
    | FormData
): Promise<ActionResult> {
  try {
    const isFormData = data instanceof FormData;
    await http(`/blogs/${id}`, {
      method: "PATCH",
      body: isFormData ? data : JSON.stringify(data),
    });

    revalidatePath("/admin/blogs");
    revalidatePath("/blog");

    return { success: true };
  } catch (error: unknown) {
    console.error("Error updating blog:", error);
    return { error: (error as Error).message || "Failed to update blog post" };
  }
}

export async function deleteBlogAction(id: string): Promise<ActionResult> {
  try {
    await http(`/blogs/${id}`, { method: "DELETE" });

    revalidatePath("/admin/blogs");
    revalidatePath("/blog");

    return { success: true };
  } catch (error: unknown) {
    console.error("Error deleting blog:", error);
    return { error: (error as Error).message || "Failed to delete blog post" };
  }
}
