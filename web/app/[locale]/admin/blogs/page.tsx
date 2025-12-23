import { Metadata } from "next";
import { BlogsClient } from "./blogs-client";

export const metadata: Metadata = {
  title: "Blog Management | Admin",
  description: "Manage blog posts",
};

async function getBlogs() {
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/api/v1";
    const res = await fetch(`${baseUrl}/blogs?limit=100`, {
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error("Failed to fetch blogs");
    }

    const data = await res.json();
    return data.data || [];
  } catch (error) {
    console.error("Error fetching blogs:", error);
    return [];
  }
}

async function getCategories() {
  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080/api/v1";
    const res = await fetch(`${baseUrl}/categories`, {
      cache: "no-store",
    });

    if (!res.ok) {
      throw new Error("Failed to fetch categories");
    }

    const data = await res.json();
    return data.data || [];
  } catch (error) {
    console.error("Error fetching categories:", error);
    return [];
  }
}

export default async function AdminBlogsPage() {
  const [blogs, categories] = await Promise.all([getBlogs(), getCategories()]);

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Blog Management</h2>
      </div>
      <div className="space-y-4">
        <p className="text-muted-foreground">
          Manage blog posts, create new articles, and configure featured
          products.
        </p>
        <BlogsClient blogs={blogs} categories={categories} />
      </div>
    </div>
  );
}
