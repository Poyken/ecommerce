import { env } from "@/lib/env";
import { Metadata } from "next";
import { BlogsClient } from "./blogs-client";

/**
 * =====================================================================
 * ADMIN BLOGS PAGE - Quản lý bài viết (Server Component)
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. QUẢN LÝ CONTENT:
 * - Trang này cho phép quản lý các bài viết trên trang web (Thêm, Xoá, Sửa, Đăng bài).
 * - Sử dụng `getBlogs` để lấy danh sách bài viết kèm theo trạng thái (Published/Draft).
 *
 * 2. ĐA DẠNG DỮ LIỆU (Parallel Fetching):
 * - Sử dụng `Promise.all` (dòng 100) để lấy đồng thời: Danh sách Blog, Danh mục (Categories) và Số lượng thống kê (Counts).
 * - Việc này giúp UI hiển thị đầy đủ thông tin ngay khi page load xong.
 *
 * 3. STATUS FILTER:
 * - Hỗ trợ lọc bài viết theo trạng thái thông qua URL parameter `status`.
 * - Giúp Admin dễ dàng quản lý các bài nháp hoặc bài đã đăng. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Đóng vai trò quan trọng trong kiến trúc hệ thống, hỗ trợ các chức năng nghiệp vụ cụ thể.

 * =====================================================================
 */

export const metadata: Metadata = {
  title: "Blog Management | Admin",
  description: "Manage blog posts",
};

async function getBlogs(
  page: number = 1,
  limit: number = 10,
  search: string = "",
  status: string = "all"
) {
  try {
    const baseUrl = env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";
    const searchParam = search ? `&search=${encodeURIComponent(search)}` : "";
    // Add status filter if not "all"
    const statusParam = status ? `&status=${status}` : "";
    const res = await fetch(
      `${baseUrl}/blogs?page=${page}&limit=${limit}${searchParam}${statusParam}`,
      {
        cache: "no-store",
      }
    );

    if (!res.ok) {
      throw new Error("Failed to fetch blogs");
    }

    const data = await res.json();
    return {
      data: data.data || [],
      meta: data.meta || { page, limit, total: data.data?.length || 0 },
    };
  } catch (error) {
    // console.error("Error fetching blogs:", error);
    return { data: [], meta: { page: 1, limit: 10, total: 0 } };
  }
}

// Fetch all blogs without pagination to get accurate counts for tabs
async function getBlogCounts() {
  try {
    const baseUrl = env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";
    const res = await fetch(`${baseUrl}/blogs?limit=1000`, {
      cache: "no-store",
    });

    if (!res.ok) {
      return { total: 0, published: 0, drafts: 0 };
    }

    const data = await res.json();
    const blogs = data.data || [];
    return {
      total: blogs.length,
      published: blogs.filter((b: any) => b.publishedAt).length,
      drafts: blogs.filter((b: any) => !b.publishedAt).length,
    };
  } catch (error) {
    return { total: 0, published: 0, drafts: 0 };
  }
}

async function getCategories() {
  try {
    const baseUrl = env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";
    const res = await fetch(`${baseUrl}/categories`, {
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error("Failed to fetch categories");
    }

    const data = await res.json();
    // Support both { data: Category[] } and { data: { data: Category[] } }
    if (data?.data && typeof data.data === "object" && "data" in data.data) {
      return data.data.data || [];
    }
    return data.data || [];
  } catch (error) {
    // console.error("Error fetching categories:", error);
    return [];
  }
}

export default async function AdminBlogsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; status?: string }>;
}) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const search = params.search || "";
  const status = params.status || "all";

  const [blogsResult, categories, counts] = await Promise.all([
    getBlogs(page, 10, search, status),
    getCategories(),
    getBlogCounts(),
  ]);

  return (
    <BlogsClient
      blogs={blogsResult.data}
      categories={categories}
      meta={blogsResult.meta}
      counts={counts}
      currentStatus={status}
    />
  );
}
