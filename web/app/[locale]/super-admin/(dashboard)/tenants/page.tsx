import { getTenantsAction } from "@/features/admin/actions";
import { TenantsClient } from "./tenants-client";

/**
 * =================================================================================================
 * SUPER ADMIN TENANTS PAGE - QUẢN LÝ DANH SÁCH CÁC CỬA HÀNG
 * =================================================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. TENANT AGGREGATION:
 *    - Fetch toàn bộ danh sách Tenants (Storefronts) hiện có trên Platform.
 *    - `getTenantsAction` trả về dữ liệu phân trang (`PaginatedData`).
 *
 * 2. DATA UNWRAPPING:
 *    - Chuyển tiếp các props `tenants`, `total`, `page`, `limit` vào `TenantsClient`.
 *    - Việc tách nhỏ giúp Logic Client-side (search, filter) không làm nặng Server component.
 *
 * 3. ERROR RESILIENCE:
 *    - Có cơ chế hiển thị lỗi ngay tại trang nếu API fetch danh sách tenants thất bại. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Đóng vai trò quan trọng trong kiến trúc hệ thống, hỗ trợ các chức năng nghiệp vụ cụ thể.

 * =================================================================================================
 */
export default async function TenantsPage() {
  // Fetch tenants
  const tenantsRes = await getTenantsAction();

  if (tenantsRes.error) {
    return (
      <div className="p-8">
        <div className="text-red-600 bg-red-50 border border-red-200 rounded p-4">
          <h2 className="font-bold mb-2">Error Loading Tenants</h2>
          <p>{tenantsRes.error}</p>
          </div>
      </div>
    );
  }

  const tenants = tenantsRes.data || [];
  const meta = tenantsRes.meta;

  return (
    <TenantsClient
      tenants={tenants}
      total={meta?.total || 0}
      page={meta?.page || 1}
      limit={meta?.limit || 10}
    />
  );
}
