

"use server";

import { REVALIDATE, wrapServerAction } from "@/lib/safe-action";
import { getTranslations } from "next-intl/server";
import { blogService } from "./services/blog.service";

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
    const res = await blogService.createBlog(data);
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
    const res = await blogService.updateBlog(id, data);
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
    const res = await blogService.deleteBlog(id);
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
    const res = await blogService.togglePublish(id);
    REVALIDATE.admin.blogs();
    return res;
  }, "Failed to update blog status");
}

export async function getMyBlogsAction() {
  const t = await getTranslations("admin.blogs");
  return wrapServerAction(() => blogService.getMyBlogs(), t("error"));
}
