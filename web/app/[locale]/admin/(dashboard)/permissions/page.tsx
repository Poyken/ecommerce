// GIẢI THÍCH CHO THỰC TẬP SINH:
// =================================================================================================
// PERMISSIONS PAGE - TRANG QUẢN LÝ QUYỀN HẠN
// =================================================================================================
//
// Server Component này đóng vai trò fetch dữ liệu ban đầu cho việc quản lý Permissions.
// Trong hệ thống RBAC (Role-Based Access Control), Permissions là các đơn vị quyền nhỏ nhất
// (ví dụ: product:create, order:view). Roles sẽ tập hợp nhiều Permissions này lại.
//
// LUỒNG DỮ LIỆU:
// 1. Gọi `getPermissionsAction` để lấy danh sách tất cả permissions khả dụng.
// 2. Truyền dữ liệu xuống `PermissionsPageClient` để render UI tương tác.
// ================================================================================================= 
import { getPermissionsAction } from "@/features/admin/actions";
import { PermissionsPageClient } from "./permissions-page-client";

export default async function PermissionsPage() {
  const result = await getPermissionsAction();
  const permissions = result.success ? result.data || [] : [];

  return <PermissionsPageClient initialPermissions={permissions} />;
}
