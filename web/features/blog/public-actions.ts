"use server";

import { blogService } from "./services/blog.service";


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
