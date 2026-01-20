import { http } from "@/lib/http";
import { ApiResponse } from "@/types/dtos";
import { BlogWithProducts } from "@/types/models";

/**
 * =====================================================================
 * BLOG SERVICE - Domain logic for blogs
 * =====================================================================
 */

export interface BlogInput {
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

export const blogService = {
  // Public
  getBlogs: async (
    paramsOrPage: number | { page?: number; limit?: number; category?: string } = 1,
    limit = 12,
    category?: string
  ) => {
    let finalPage = 1;
    let finalLimit = 12;
    let finalCategory = category;

    if (typeof paramsOrPage === "object") {
      finalPage = paramsOrPage.page ?? 1;
      finalLimit = paramsOrPage.limit ?? 12;
      finalCategory = paramsOrPage.category;
    } else {
      finalPage = paramsOrPage;
      finalLimit = limit;
    }

    return http.get<ApiResponse<BlogWithProducts[]>>("/blogs", {
      params: { page: finalPage, limit: finalLimit, category: finalCategory },
      skipAuth: true,
      next: { revalidate: 60 },
    });
  },

  getCategoryStats: async () => {
    const res = await http.get<ApiResponse<any>>("/blogs/stats", {
      skipAuth: true,
      next: { revalidate: 3600 },
    });
    return res?.data || null;
  },

  getBlogBySlug: async (slug: string) => {
    const res = await http.get<ApiResponse<BlogWithProducts>>(`/blogs/${slug}`, {
      skipAuth: true,
      next: { revalidate: 60 },
    });
    return res?.data || null;
  },

  getBlogIds: async () => {
    const res = await http.get<ApiResponse<BlogWithProducts[]>>("/blogs", {
      params: { limit: 100 },
      skipAuth: true,
    });
    return res?.data?.map((blog) => blog.id) || [];
  },

  // Admin / CRUD
  createBlog: async (data: BlogInput | FormData) => {
    const isFormData = data instanceof FormData;
    return http("/blogs", {
      method: "POST",
      body: isFormData ? data : JSON.stringify(data),
    });
  },

  updateBlog: async (id: string, data: BlogInput | FormData) => {
    const isFormData = data instanceof FormData;
    return http(`/blogs/${id}`, {
      method: "PATCH",
      body: isFormData ? data : JSON.stringify(data),
    });
  },

  deleteBlog: async (id: string) => {
    return http.delete(`/blogs/${id}`);
  },

  togglePublish: async (id: string) => {
    return http.patch(`/blogs/${id}/toggle-publish`);
  },

  getMyBlogs: async () => {
    return http.get<ApiResponse<BlogWithProducts[]>>("/blogs/my-blogs", {
      next: { tags: ["my-blogs"] },
    });
  },
};
