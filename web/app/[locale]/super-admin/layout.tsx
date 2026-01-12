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
import { getPermissionsFromToken } from "@/lib/permission-utils";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";

// Super Admin Layout - similar to Admin Layout but with specific checks if needed
// For now, relies on standard AuthProvider and we will check role in sub-layout or middleware
// But we can add a quick check here.

/**
 * =================================================================================================
 * SUPER ADMIN ROOT LAYOUT - TẦNG KHỞI TẠO DỮ LIỆU SUPER ADMIN
 * =================================================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. PERMISSION-BASED PROTECT:
 *    - Ngoài việc check Login, trang này check quyền `superAdmin:read` ngay từ đầu qua Token.
 *    - Nếu không đủ quyền, `redirect("/admin")` ngay lập tức để bảo đảm an toàn hệ thống.
 *
 * 2. GLOBAL PROVIDERS:
 *    - `AuthProvider`: Cung cấp thông tin quyền hạn xuống cho các component con.
 *    - `AdminMetadataProvider`: Quản lý Meta data dùng chung (danh sách Brands, Categories) để các
 *      form trong Super Admin không phải fetch đi fetch lại nhiều lần.
 *
 * 3. INITIALIZATION LOOP:
 *    - `NotificationInitializer`: Khởi tạo hệ thống Socket/Thông báo ngay khi vào khu vực quản trị. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Đóng vai trò quan trọng trong kiến trúc hệ thống, hỗ trợ các chức năng nghiệp vụ cụ thể.

 * =================================================================================================
 */
export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken")?.value;
  const permissions = getPermissionsFromToken(token);

  // Quick initial check for SSR
  const hasSuperAdminAccess = permissions.includes("superAdmin:read");

  if (!hasSuperAdminAccess) {
    redirect("/admin");
  }

  return (
    <AuthProvider initialPermissions={permissions}>
      <Suspense fallback={<LoadingScreen message="Initializing Platform..." />}>
        <DynamicSuperAdminContent token={token}>
          {children}
        </DynamicSuperAdminContent>
      </Suspense>
    </AuthProvider>
  );
}

async function DynamicSuperAdminContent({
  children,
  token,
}: {
  children: React.ReactNode;
  token?: string;
}) {
  const [profile, notificationsRes, unreadCountRes, brandsRes, categoriesRes] =
    await Promise.all([
      getProfileAction(),
      getNotificationsAction(10).catch(() => ({ data: [] })),
      getUnreadCountAction().catch(() => ({ count: 0 })),
      getBrandsAction().catch(() => ({ data: [] })),
      getCategoriesAction().catch(() => ({ data: [] })),
    ]);
  const user = profile.data;

  if (!user) {
    return <AuthRedirect />;
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
    <>
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
    </>
  );
}
