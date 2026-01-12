import { UsersPageClient } from "@/app/[locale]/admin/(dashboard)/users/users-page-client";
import { getUsersAction } from "@/features/admin/actions";

async function getUserCounts() {
  try {
    const [all, admins, users] = await Promise.all([
      getUsersAction({ page: 1, limit: 1 }),
      getUsersAction({ page: 1, limit: 1, search: "", role: "ADMIN" }),
      getUsersAction({ page: 1, limit: 1, search: "", role: "USER" }),
    ]);

    return {
      total: "data" in all ? all.meta?.total || 0 : 0,
      admin: "data" in admins ? admins.meta?.total || 0 : 0,
      user: "data" in users ? users.meta?.total || 0 : 0,
    };
  } catch {
    return { total: 0, admin: 0, user: 0 };
  }
}

/**
 * =================================================================================================
 * SUPER ADMIN USERS PAGE - QUẢN LÝ NGƯỜI DÙNG TOÀN HỆ THỐNG
 * =================================================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. MULTI-ROLE MONITORING:
 *    - `getUserCounts`: Hàm helper để đếm nhanh số lượng ADMIN và USER đang có.
 *    - Giúp Super Admin có cái nhìn tổng quan về quy mô cộng đồng người dùng.
 *
 * 2. CROSS-TENANT USER MANAGEMENT:
 *    - Hiển thị danh sách User từ mọi Tenant. Cho phép quản trị viên cấp cao nhất can thiệp
 *      nếu có vấn đề về tài khoản.
 *
 * 3. SHARED CLIENT LOGIC:
 *    - Sử dụng `UsersPageClient` chung với Admin thường nhưng cung cấp `basePath` khác nhau. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Đóng vai trò quan trọng trong kiến trúc hệ thống, hỗ trợ các chức năng nghiệp vụ cụ thể.

 * =================================================================================================
 */
export default async function SuperAdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const page = Number(params?.page) || 1;
  const limit = Number(params?.limit) || 10;
  const search = (params?.search as string) || "";
  const role = (params?.role as string) || "all";

  const [response, counts] = await Promise.all([
    getUsersAction({ page, limit, search, role }),
    getUserCounts(),
  ]);

  if ("error" in response) {
    return (
      <div className="p-8 text-center text-red-500">
        Error loading users: {response.error}
      </div>
    );
  }

  return (
    <UsersPageClient
      initialUsers={response.data || []}
      total={response.meta?.total || 0}
      page={page}
      limit={limit}
      counts={counts}
      currentRole={role}
      basePath="/super-admin/users"
    />
  );
}
