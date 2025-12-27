import { getBrandsAction } from "@/features/admin/actions";
import { BrandsPageClient } from "./brands-client";

/**
 * =====================================================================
 * ADMIN BRANDS PAGE - Quản lý thương hiệu (Server Component)
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. SERVER-SIDE DATA FETCHING:
 * - Sử dụng `getBrandsAction` (Server Action) để lấy danh sách thương hiệu trực tiếp từ database trên server.
 * - Server Component giúp ẩn giấu logic fetch data nhạy cảm khỏi phía Client.
 *
 * 2. SEARCH PARAMS & PAGINATION:
 * - Nhận `searchParams` để thực hiện tìm kiếm và phân trang thương hiệu.
 * - `page` và `limit` được truyền vào Action để lấy đúng tập dữ liệu cần thiết.
 *
 * 3. COMPONENT COMPOSITION:
 * - Dữ liệu sau khi fetch thành công sẽ được truyền vào `BrandsPageClient`.
 * - `BrandsPageClient` (Client Component) sẽ xử lý tương tác người dùng như mở Dialog Thêm/Sửa/Xoá.
 * =====================================================================
 */

export default async function BrandsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string; limit?: string }>;
}) {
  const params = await searchParams;
  const search = params.search || "";
  const page = Number(params.page) || 1;
  const limit = Number(params.limit) || 10;

  const result = await getBrandsAction(page, limit, search);

  if ("error" in result) {
    return (
      <div className="text-red-600">Error loading brands: {result.error}</div>
    );
  }

  return <BrandsPageClient brands={result.data || []} meta={result.meta} />;
}
