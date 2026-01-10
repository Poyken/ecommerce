// GIẢI THÍCH CHO THỰC TẬP SINH:
// =================================================================================================
// ROLES MANAGEMENT PAGE - QUẢN LÝ VAI TRÒ
// =================================================================================================
//
// Server Component cho trang quản lý Roles trong Admin Dashboard.
// Roles định nghĩa nhóm quyền hạn (Permissions) mà một nhân viên có thể có.
//
// DATA FETCHING:
// - `getRolesAction`: Gọi API nội bộ để lấy danh sách Roles của Tenant hiện tại.
// - Xử lý `result.success` để đảm bảo không crash nếu API lỗi (trả về mảng rỗng).
// ================================================================================================= 
import { getRolesAction } from "@/features/admin/actions";
import { RolesPageClient } from "./roles-page-client";

export default async function RolesPage() {
  const result = await getRolesAction();
  const roles = result.success ? result.data || [] : [];
  return <RolesPageClient initialRoles={roles} />;
}
