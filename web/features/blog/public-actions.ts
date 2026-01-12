"use server";

import { http } from "@/lib/http";
import { ApiResponse } from "@/types/dtos";
import { BlogWithProducts } from "@/types/models";

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
 * - Đóng vai trò quan trọng trong kiến trúc hệ thống, hỗ trợ các chức năng nghiệp vụ cụ thể.

 * =====================================================================
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
