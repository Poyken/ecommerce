import { getBrandsAction, getCategoriesAction } from "@/actions/admin";
import {
  getNotificationsAction,
  getUnreadCountAction,
} from "@/actions/notifications";
import { getProfileAction } from "@/actions/profile";
import { LoadingScreen } from "@/components/atoms/loading-screen";
import { AdminHeader } from "@/components/organisms/admin/admin-header";
import { AdminSidebar } from "@/components/organisms/admin/admin-sidebar";
import { NotificationProvider } from "@/contexts/notification-context";
import { getPermissionsFromToken } from "@/lib/permission-utils";
import { AdminMetadataProvider } from "@/providers/admin-metadata-provider";
import { AuthProvider } from "@/providers/auth-provider";
import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Suspense } from "react";

/**
 * =====================================================================
 * ADMIN LAYOUT - Layout cho trang quản trị
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * LAYOUT STRUCTURE:
 * - Sử dụng Flexbox để chia layout thành 2 phần: Sidebar (trái) và Main Content (phải).
 * - `min-h-screen`: Đảm bảo layout luôn cao ít nhất bằng màn hình.
 *
 * HYBRID & CACHING:
 * - `AdminMetadataProvider` sử dụng SWR để cache Brands và Categories toàn cục.
 * - Dữ liệu được pre-fetch trên server và truyền xuống client làm "initial data".
 *
 * PROVIDERS:
 * - `AuthProvider`: Quản lý quyền hạn.
 * - `NotificationProvider`: Quản lý thông báo thời gian thực.
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
  if (!user) {
    redirect("/login");
  }

  const initialBrands = brandsRes?.data || [];
  const initialCategories = categoriesRes?.data || [];
  const initialNotifications = notificationsRes?.data || [];
  const initialUnreadCount = unreadCountRes?.count || 0;

  const token = cookieStore.get("accessToken")?.value;
  const permissions = getPermissionsFromToken(token);

  return (
    <AuthProvider initialPermissions={permissions}>
      <NotificationProvider
        userId={user.id}
        initialNotifications={initialNotifications}
        initialUnreadCount={initialUnreadCount}
        accessToken={token}
      >
        <AdminMetadataProvider
          initialBrands={initialBrands}
          initialCategories={initialCategories}
        >
          <div className="flex min-h-screen bg-muted/40 dark:bg-background text-foreground font-sans">
            <AdminSidebar />
            <main className="relative z-10 flex-1 flex flex-col min-w-0">
              <AdminHeader user={user} />
              <div className="max-w-7xl mx-auto p-4 md:p-8 w-full">
                {children}
              </div>
            </main>
          </div>
        </AdminMetadataProvider>
      </NotificationProvider>
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
