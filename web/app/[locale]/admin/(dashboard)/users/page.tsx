import { getUsersAction } from "@/features/admin/actions";
import { UsersPageClient } from "./users-page-client";

/**
 * =====================================================================
 * ADMIN USERS PAGE - Quản lý người dùng (Server Component)
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. QUẢN LÝ NGƯỜI DÙNG (User Management):
 * - Trang này hiển thị danh sách tất cả người dùng đã đăng ký trong hệ thống.
 * - Admin có thể xem thông tin, chỉnh sửa vai trò, hoặc vô hiệu hóa tài khoản.
 *
 * 2. ROLE-BASED FILTERING:
 * - Hỗ trợ lọc người dùng theo vai trò (Role): All, Admin, User, Manager, v.v.
 * - `getUserCounts` đếm số lượng người dùng theo từng vai trò để hiển thị trên Tab.
 *
 * 3. SEARCH & PAGINATION:
 * - Tìm kiếm theo tên hoặc email người dùng.
 * - Phân trang để xử lý hiệu quả khi có hàng nghìn người dùng.
 * =====================================================================
 */

async function getUserCounts() {
  try {
    // Fetch counts for common roles
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
  } catch (error) {
    // console.error("Error fetching user counts:", error);
    return { total: 0, admin: 0, user: 0 };
  }
}

export default async function UsersPage({
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
    />
  );
}
