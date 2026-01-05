import { LoadingScreen } from "@/components/shared/loading-screen";
import { getBrandsAction, getCategoriesAction } from "@/features/admin/actions";
import { AdminMetadataProvider } from "@/features/admin/providers/admin-metadata-provider";
import { AuthRedirect } from "@/features/auth/components/auth-redirect";
import { AuthProvider } from "@/features/auth/providers/auth-provider";
import {
  getNotificationsAction,
  getUnreadCountAction,
} from "@/features/notifications/actions";
import { NotificationInitializer } from "@/features/notifications/components/notification-initializer";
import { getProfileAction } from "@/features/profile/actions";
import { redirect } from "@/i18n/routing";
import { getPermissionsFromToken } from "@/lib/permission-utils";
import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { Suspense } from "react";

/**
 * =====================================================================
 * ADMIN LAYOUT - Khung sườn nền tảng cho trang quản trị
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. CẤU TRÚC LAYOUT (Layout Structure):
 * - Sử dụng CSS Flexbox: Chia màn hình thành Sidebar cố định (trái) và vùng Content linh hoạt (phải).
 * - `min-h-screen`: Đảm bảo giao diện luôn phủ kín chiều cao màn hình trình duyệt.
 *
 * 2. QUẢN LÝ DỮ LIỆU TOÀN CỤC (Providers):
 * - `AuthProvider`: Lưu trữ và quản lý quyền hạn (Permissions) của Admin xuyên suốt các trang con.
 * - `NotificationProvider`: Kết nối Socket và quản lý thông báo thời gian thực (Real-time).
 * - `AdminMetadataProvider`: Sử dụng SWR để cache danh sách Brands và Categories, tránh việc fetch đi fetch lại ở nhiều trang khác nhau.
 *
 * 3. DATA PRE-FETCHING (Hydration):
 * - Fetch dữ liệu quan trọng ngay tại Server Layout và truyền xuống Client qua props (initial data).
 * - Điều này giúp UI hiển thị ngay lập tức (SEO tốt và trải nghiệm mượt mà) mà không cần chờ Client gọi API.
 *
 * 4. BẢO MẬT & ĐIỀU HƯỚNG:
 * - Kiểm tra profile người dùng trên Server. Nếu chưa đăng nhập hoặc không đủ quyền, thực hiện `redirect("/login")` ngay lập tức.
 * =====================================================================
 */

async function DynamicAdminContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();

  const [profile, notificationsRes, unreadCountRes, brandsRes, categoriesRes] =
    await Promise.all([
      getProfileAction(),
      getNotificationsAction(10).catch(() => ({ data: [] })),
      getUnreadCountAction().catch(() => ({ count: 0 })),
      getBrandsAction().catch(() => ({ data: [] })),
      getCategoriesAction().catch(() => ({ data: [] })),
    ]);
  const user = profile.data;
  const token = cookieStore.get("accessToken")?.value;
  const permissions = getPermissionsFromToken(token);

  /* console.log("[AdminLayout] Data check:", {
    hasUser: !!user,
    hasToken: !!token,
    roles: user?.roles?.map((r: any) => r.role?.name),
    permissionsCount: permissions.length,
    profileError: (profile as any).error,
  }); */

  if (!user) {
    console.warn("[AdminLayout] No user found, redirecting to /login");
    return <AuthRedirect />;
  }

  // Check admin permission
  if (!permissions.includes('admin:read')) {
    console.warn("[AdminLayout] User missing admin:read permission");
    redirect("/" as any);
  }

  const initialBrands =
    brandsRes && "data" in brandsRes ? brandsRes.data || [] : [];
  const initialCategories =
    categoriesRes && "data" in categoriesRes ? categoriesRes.data || [] : [];
  const initialNotifications =
    notificationsRes && "data" in notificationsRes
      ? notificationsRes.data || []
      : [];
  const initialUnreadCount =
    unreadCountRes && "count" in unreadCountRes ? unreadCountRes.count || 0 : 0;

  return (
    <AuthProvider initialPermissions={permissions}>
      <NotificationInitializer
        userId={user.id}
        initialNotifications={initialNotifications}
        initialUnreadCount={initialUnreadCount}
        accessToken={token}
      />
      <AdminMetadataProvider
        initialBrands={initialBrands}
        initialCategories={initialCategories}
      >
        {children}
      </AdminMetadataProvider>
    </AuthProvider>
  );
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = await getTranslations("loading");
  return (
    <Suspense fallback={<LoadingScreen message={t("admin")} />}>
      <DynamicAdminContent>{children}</DynamicAdminContent>
    </Suspense>
  );
}
