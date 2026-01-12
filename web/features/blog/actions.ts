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
 * ⚠️ LƯU Ý: Các action này thường được gọi từ Admin Dashboard. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Content Marketing: Cung cấp các công cụ cho bộ phận Marketing biên tập và xuất bản bài viết, giúp tăng lượng truy cập tự nhiên (Organic Traffic) vào website.
 * - Dynamic SEO: Tự động cập nhật cache bài viết mới nhất lên giao diện người dùng (Revalidate), đảm bảo khách hàng và bot tìm kiếm luôn thấy nội dung mới nhất.

 * =====================================================================
 */

"use server";

import { http } from "@/lib/http";
import { REVALIDATE, wrapServerAction } from "@/lib/safe-action";
import { BlogWithProducts } from "@/types/models";
import { getTranslations } from "next-intl/server";

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
) {
  return wrapServerAction(async () => {
    const isFormData = data instanceof FormData;
    const res = await http("/blogs", {
      method: "POST",
      body: isFormData ? data : JSON.stringify(data),
    });

    REVALIDATE.admin.blogs();
    return res;
  }, "Failed to create blog post");
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
) {
  return wrapServerAction(async () => {
    const isFormData = data instanceof FormData;
    const res = await http(`/blogs/${id}`, {
      method: "PATCH",
      body: isFormData ? data : JSON.stringify(data),
    });

    REVALIDATE.admin.blogs();
    return res;
  }, "Failed to update blog post");
}

/**
 * Xóa bài viết blog.
 *
 * @param id - ID của bài viết cần xóa
 */
export async function deleteBlogAction(id: string) {
  return wrapServerAction(async () => {
    const res = await http(`/blogs/${id}`, { method: "DELETE" });
    REVALIDATE.admin.blogs();
    return res;
  }, "Failed to delete blog post");
}

/**
 * Toggle trạng thái Publish của bài viết.
 *
 * @param id - ID bài viết
 */
export async function toggleBlogPublishAction(id: string) {
  return wrapServerAction(async () => {
    const res = await http(`/blogs/${id}/toggle-publish`, { method: "PATCH" });
    REVALIDATE.admin.blogs();
    return res;
  }, "Failed to update blog status");
}

export async function getMyBlogsAction() {
  const t = await getTranslations("admin.blogs");
  return wrapServerAction(
    () =>
      http(`/blogs/my-blogs`, {
        method: "GET",
        next: { tags: ["my-blogs"] },
      }),
    t("error")
  );
}
