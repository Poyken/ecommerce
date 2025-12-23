import { getBrandsAction } from "@/actions/admin";
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
 * - Giúp giảm tải cho client và bảo mật thông tin tốt hơn.
 *
 * 2. SEARCH PARAMS:
 * - Nhận `searchParams` từ URL để thực hiện tính năng tìm kiếm thương hiệu.
 * - Vì `searchParams` trong Next.js 15 là một Promise, ta cần `await` nó.
 *
 * 3. ERROR HANDLING:
 * - Kiểm tra kết quả trả về từ Server Action. Nếu có lỗi, hiển thị thông báo lỗi ngay lập tức.
 * =====================================================================
 */

export default async function BrandsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const params = await searchParams;
  const search = params.search || "";
  const result = await getBrandsAction(search);

  if (!("data" in result)) {
    return (
      <div className="text-red-600">
        Error loading brands: {(result as any).error}
      </div>
    );
  }

  const brands = result.data;

  return <BrandsPageClient brands={brands || []} />;
}
