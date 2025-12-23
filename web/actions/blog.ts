/**
 * =====================================================================
 * BLOG SERVER ACTIONS - Quản lý bài viết (Blog)
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * File này chứa các Server Actions để quản lý bài viết trên trang Blog.
 * Admin có thể thực hiện các thao tác CRUD (Create, Read, Update, Delete).
 *
 * CÁC TÍNH NĂNG CHÍNH:
 * 1. Tạo bài viết mới (hỗ trợ cả JSON và FormData cho upload ảnh).
 * 2. Cập nhật bài viết hiện có.
 * 3. Xóa bài viết.
 * 4. Revalidate cache để cập nhật giao diện ngay lập tức.
 *
 * ⚠️ LƯU Ý: Các action này thường được gọi từ Admin Dashboard.
 * =====================================================================
 */

"use server";

import { http } from "@/lib/http";
import { ActionResult } from "@/types/dtos";
import { revalidatePath } from "next/cache";

/**
 * Tạo bài viết blog mới.
 *
 * @param data - Dữ liệu bài viết (Object hoặc FormData)
 * @returns ActionResult chứa trạng thái thành công hoặc lỗi
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

    // Làm mới cache cho trang quản trị và trang blog người dùng
    revalidatePath("/admin/blogs");
    revalidatePath("/blog");

    return { success: true };
  } catch (error: unknown) {
    console.error("Error creating blog:", error);
    return { error: (error as Error).message || "Failed to create blog post" };
  }
}

/**
 * Cập nhật bài viết blog đã tồn tại.
 *
 * @param id - ID của bài viết cần cập nhật
 * @param data - Dữ liệu cập nhật mới
 */
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

/**
 * Xóa bài viết blog.
 *
 * @param id - ID của bài viết cần xóa
 */
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
