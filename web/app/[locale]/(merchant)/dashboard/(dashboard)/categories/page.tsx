import { getCategoriesAction } from "@/features/admin/actions";
import { CategoriesPageClient } from "./categories-client";

/**
 * =====================================================================
 * ADMIN CATEGORIES PAGE - Quản lý danh mục (Server Component)
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. SERVER-SIDE DATA FETCHING:
 * - Sử dụng `getCategoriesAction` (Server Action) để lấy danh sách danh mục trực tiếp từ database.
 * - Server Components giúp giảm kích thước bundle gửi xuống client vì code fetch data không cần chạy ở trình duyệt.
 *
 * 2. SEARCH PARAMS:
 * - Hỗ trợ tìm kiếm danh mục thông qua tham số `search` trên URL.
 * - Tận dụng khả năng xử lý bất đồng bộ của Next.js 15 với `searchParams`.
 *
 * 3. COMPONENT COMPOSITION:
 * - Trang này đóng vai trò là "Data Fetcher", sau đó truyền dữ liệu vào `CategoriesPageClient` để xử lý UI và tương tác. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Taxonomical Structure Management: Cho phép Admin xây dựng và duy trì cấu trúc cây danh mục sản phẩm một cách khoa học, giúp khách hàng dễ dàng tìm kiếm và khám phá sản phẩm trên Storefront.
 * - SEO Catalog Hierarchy: Tối ưu hóa cấu trúc URL và điều hướng trang web theo danh mục, nâng cao khả năng hiển thị của cửa hàng trên các công cụ tìm kiếm thông qua việc phân loại nội dung rõ ràng.

 * =====================================================================
 */

export default async function CategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string; limit?: string }>;
}) {
  const params = await searchParams;
  const search = params.search || "";
  const page = Number(params.page) || 1;
  const limit = Number(params.limit) || 10;

  const result = await getCategoriesAction(page, limit, search);

  if ("error" in result) {
    return (
      <div className="text-red-600">
        Error loading categories: {result.error}
      </div>
    );
  }

  return (
    <CategoriesPageClient categories={result.data || []} meta={result.meta} />
  );
}
