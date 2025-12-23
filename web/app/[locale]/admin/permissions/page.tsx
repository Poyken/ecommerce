import { getPermissionsAction } from "@/actions/admin";
import { getTranslations } from "next-intl/server";
import { PermissionsPageClient } from "./permissions-client";

/**
 * =====================================================================
 * ADMIN PERMISSIONS PAGE - Quản lý quyền hạn (Server Component)
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. RBAC (Role-Based Access Control):
 * - Đây là trang quản lý các quyền (Permissions) cơ bản trong hệ thống (VD: `product:create`, `order:read`).
 * - Các quyền này sau đó sẽ được gán cho các vai trò (Roles).
 *
 * 2. SERVER-SIDE DATA FETCHING:
 * - Sử dụng `getPermissionsAction` để lấy toàn bộ danh sách quyền từ database.
 *
 * 3. ERROR HANDLING:
 * - Hiển thị thông báo lỗi rõ ràng nếu không thể kết nối API hoặc có lỗi từ phía server.
 * =====================================================================
 */

export default async function PermissionsPage() {
  const t = await getTranslations("admin.permissions");
  const result = await getPermissionsAction();

  if (!("data" in result)) {
    return (
      <div className="p-8">
        <div className="text-red-600 bg-red-50 border border-red-200 rounded p-4">
          <h2 className="font-bold mb-2">{t("errorLoading")}</h2>
          <p>{(result as any).error}</p>
        </div>
      </div>
    );
  }

  const permissions = result.data;

  return <PermissionsPageClient permissions={permissions || []} />;
}
