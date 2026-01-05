import { getRolesAction } from "@/features/admin/actions";
import { RolesPageClient } from "./roles-client";

/**
 * =====================================================================
 * ADMIN ROLES PAGE - Quản lý vai trò (Server Component)
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. RBAC (Role-Based Access Control):
 * - Đây là nơi định nghĩa các vai trò trong hệ thống (VD: `Admin`, `Manager`, `Customer`).
 * - Mỗi vai trò sẽ được gán các quyền (Permissions) khác nhau.
 *
 * 2. SERVER-SIDE DATA FETCHING:
 * - Sử dụng `getRolesAction` để lấy danh sách vai trò.
 * - Hỗ trợ tìm kiếm vai trò thông qua `searchParams`.
 *
 * 3. SECURITY:
 * - Việc quản lý vai trò là cực kỳ quan trọng, chỉ những user có quyền cao nhất mới được truy cập trang này.
 * =====================================================================
 */

export default async function RolesPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; page?: string; limit?: string }>;
}) {
  const params = await searchParams;
  const search = params.search || "";
  const page = Number(params.page) || 1;
  const limit = Number(params.limit) || 10;
  const result = await getRolesAction(page, limit, search);

  if ("error" in result) {
    return (
      <div className="text-red-600">Error loading roles: {result.error}</div>
    );
  }

  return <RolesPageClient roles={result.data || []} meta={result.meta} />;
}
