import { getUsersAction } from "@/actions/admin";
import { UsersPageClient } from "./users-page-client";

/**
 * =====================================================================
 * ADMIN USERS PAGE - Quản lý người dùng (Server Component)
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. USER MANAGEMENT:
 * - Trang này hiển thị danh sách toàn bộ người dùng trong hệ thống.
 * - Admin có thể tìm kiếm user theo tên hoặc email.
 *
 * 2. SERVER-SIDE FETCHING:
 * - Sử dụng `getUsersAction` để lấy dữ liệu user kèm thông tin phân trang.
 * - Đảm bảo dữ liệu luôn mới nhất mỗi khi trang được tải lại.
 *
 * 3. SECURITY & PRIVACY:
 * - Chỉ hiển thị các thông tin cần thiết cho việc quản lý.
 * - Các thông tin nhạy cảm (như mật khẩu) tuyệt đối không được trả về từ API này.
 * =====================================================================
 */

export default async function UsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string }>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);
  const limit = 10;
  const search = params.search || "";

  const result = await getUsersAction(page, limit, search);

  if (!("data" in result)) {
    return (
      <div className="text-red-600">
        Error loading users: {(result as any).error}
      </div>
    );
  }

  return (
    <UsersPageClient
      users={result.data || []}
      total={result.meta?.total || 0}
      page={page}
      limit={limit}
    />
  );
}
