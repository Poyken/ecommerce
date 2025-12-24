"use server";

import { http } from "@/lib/http";
import { ApiResponse } from "@/types/dtos";
import { BlogWithProducts } from "@/types/models";

/**
 * Fetch danh sách bài viết blog (Public access).
 * Server Action này dùng cho Client Component để Load More.
 */
export async function getBlogsAction(
  page: number,
  limit: number = 12,
  category?: string
) {
  try {
    const res = await http<ApiResponse<BlogWithProducts[]>>("/blogs", {
      params: { page, limit, category },
      skipAuth: true,
      next: { revalidate: 60 }, // Cache ngắn hạn cho load more
    });

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
