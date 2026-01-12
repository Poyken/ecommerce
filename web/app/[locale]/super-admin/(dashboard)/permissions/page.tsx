import { getPermissionsAction } from "@/features/admin/actions";
import { getTranslations } from "next-intl/server";
import { PermissionsPageClient } from "./permissions-client";

/**
 * =====================================================================
 * ADMIN PERMISSIONS PAGE - Quản lý quyền hạn (Server Component)
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. QUYỀN HẠN CẤP THẤP (Low-level Permissions):
 * - Hệ thống sử dụng mô hình RBAC (Role-Based Access Control).
 * - Trang này quản lý các "nguyên tử" quyền hạn. Ví dụ: `product:create`, `user:delete`.
 * - Chia nhỏ quyền giúp kiểm soát an ninh hệ thống cực kỳ chi tiết.
 *
 * 2. CƠ CHẾ FETCH DỮ LIỆU:
 * - Dữ liệu được fetch trực tiếp từ Server qua `getPermissionsAction`.
 * - Danh sách này thường không quá lớn nên có thể fetch toàn bộ mà không cần phân trang phức tạp.
 *
 * 3. BẢO MẬT:
 * - Chỉ những tài khoản có quyền `permission:read` mới có thể truy cập và xem danh sách này. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Đóng vai trò quan trọng trong kiến trúc hệ thống, hỗ trợ các chức năng nghiệp vụ cụ thể.

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
