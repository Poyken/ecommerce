"use server";

import { blogService } from "./services/blog.service";

/**
 * =====================================================================
 * BLOG PUBLIC ACTIONS
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. SERVER ACTION FOR CLIENT COMPONENTS:
 * - Dùng để fetch data cho Client Component (VD: Load More button).
 * - `skipAuth: true`: Cho phép gọi API mà không cần Login (Public).
 * - `revalidate: 60`: Cache kết quả trong 60s để giảm tải Server. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Organic Search Traffic: Tối ưu hóa việc tải danh sách bài viết blog cho người dùng vãng lai, giúp cải thiện chỉ số mượt mà (LCP) và SEO cho các trang tin tức.
 * - Edge Caching: Tận dụng cơ chế `revalidate` của Next.js để phục vụ hàng nghìn lượt xem blog mỗi phút mà không làm tăng tải trọng lên cơ sở dữ liệu chính.

 * =====================================================================
 */
export async function getBlogsAction(
  page: number,
  limit: number = 12,
  category?: string
) {
  try {
    const res = await blogService.getBlogs(page, limit, category);

    if (!res || !res.data) {
      return { success: false, data: [], meta: null };
    }

    return {
      success: true,
      data: res.data,
      meta: res.meta,
    };
  } catch (error) {
    console.error("Failed to fetch blogs:", error);
    return { success: false, data: [], meta: null };
  }
}
