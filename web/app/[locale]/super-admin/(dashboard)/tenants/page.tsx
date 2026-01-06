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
 *    - Có cơ chế hiển thị lỗi ngay tại trang nếu API fetch danh sách tenants thất bại.
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

  // Handle PaginatedData response
  // Assuming getTenantsAction returns { data: PaginatedData<Tenant> } or similar based on my implementation
  // create-tenant-dialog.tsx implementation of getTenantsAction return:
  /*
    return {
        data: res, // Tenant[]
        meta: { ... }
    };
  */
  // So tenantsRes.data is { data: Tenant[], meta: ... } ?
  // No, ActionResult<T> has .data: T.
  // getTenantsAction returns ActionResult<PaginatedData<Tenant>>.
  // So tenantsRes.data IS PaginatedData<Tenant>.
  // PaginatedData has .data (Tenant[]) and .meta.

  const paginatedData = tenantsRes.data;

  // Safety check
  if (!paginatedData || !Array.isArray(paginatedData.data)) {
    return <div>Invalid data format</div>;
  }

  return (
    <TenantsClient
      tenants={paginatedData.data}
      total={paginatedData.meta.total}
      page={paginatedData.meta.page}
      limit={paginatedData.meta.limit}
    />
  );
}
