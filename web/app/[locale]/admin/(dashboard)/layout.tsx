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
    <div className="flex h-screen bg-background relative overflow-hidden font-sans">
      {/* Aurora Glows for Admin Area */}
      <div className="absolute -top-[10%] -left-[10%] w-[400px] h-[400px] bg-[var(--aurora-blue)]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[20%] -right-[5%] w-[350px] h-[350px] bg-[var(--aurora-purple)]/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-[40%] left-[20%] w-[300px] h-[300px] bg-[var(--aurora-orange)]/5 rounded-full blur-[80px] pointer-events-none" />
      
      <AdminSidebar />
      <main className="relative z-10 flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        <AdminHeader user={user} />
        <div className="flex-1 overflow-y-auto no-scrollbar">
          <div className="max-w-7xl mx-auto p-4 md:p-8 w-full relative">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
