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
  getBlogs: async (page = 1, limit = 12, category?: string) => {
    return http.get<ApiResponse<BlogWithProducts[]>>("/blogs", {
      params: { page, limit, category },
      skipAuth: true,
      next: { revalidate: 60 },
    });
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
    return http.get("/blogs/my-blogs", {
      next: { tags: ["my-blogs"] },
    });
  },
};
