import { AdminHeader } from "@/features/admin/components/navigation/admin-header";
import { AdminSidebar } from "@/features/admin/components/navigation/admin-sidebar";
import { AuthRedirect } from "@/features/auth/components/auth-redirect";
import { getProfileAction } from "@/features/profile/actions";

/**
 * =================================================================================================
 * ADMIN DASHBOARD LAYOUT - KHUNG GIAO DIỆN QUẢN TRỊ VIÊN
 * =================================================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. PERSISTENT NAVIGATION:
 *    - `AdminSidebar`: Thanh điều hướng bên trái được giữ cố định.
 *    - `AdminHeader`: Thanh công cụ phía trên chứa thông tin User và các nút chức năng nhanh.
 *
 * 2. AUTHENTICATION PROTECTION:
 *    - Kiểm tra `profile.data`. Nếu không có User (chưa đăng nhập), sử dụng `AuthRedirect`
 *      để đẩy người dùng về trang login.
 *
 * 3. THEME & STYLING:
 *    - `bg-muted/40`: Sử dụng màu nền xám nhẹ để làm nổi bật các Card chứa dữ liệu.
 *    - `font-sans`: Đảm bảo phông chữ đồng bộ cho toàn bộ khu vực Dashboard. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - High-Performance Admin Portal: Thiết lập nền tảng quản trị nhanh và mượt mà nhờ cơ chế Server-side rendering, giúp Admin xử lý hàng trăm tác vụ mỗi ngày mà không bị trễ.
 * - Centralized Authentication Guarding: Đảm bảo an toàn tuyệt đối cho dữ liệu kinh doanh bằng cách kiểm tra quyền truy cập ngay từ lớp Layout (Root) của khu vực Admin.
 *
 * =================================================================================================
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getProfileAction();
  const user = profile.data;

  if (!user) {
    return <AuthRedirect />;
  }

  return (
    <div className="flex min-h-screen bg-muted/40 dark:bg-background text-foreground font-sans">
      <AdminSidebar />
      <main className="relative z-10 flex-1 flex flex-col min-w-0">
        <AdminHeader user={user} />
        <div className="max-w-7xl mx-auto p-4 md:p-8 w-full">{children}</div>
      </main>
    </div>
  );
}
