import { getBrandsAction, getCategoriesAction } from "@/features/admin/actions";
import {
    getNotificationsAction,
    getUnreadCountAction,
} from "@/features/notifications/actions";
import { getProfileAction } from "@/features/profile/actions";
import { LoadingScreen } from "@/components/shared/loading-screen";
import { AdminHeader } from "@/features/admin/components/admin-header";
import { AdminSidebar } from "@/features/admin/components/admin-sidebar";
import { NotificationProvider } from "@/contexts/notification-context";
import { getPermissionsFromToken } from "@/lib/permission-utils";
import { AdminMetadataProvider } from "@/features/admin/providers/admin-metadata-provider";
import { AuthProvider } from "@/features/auth/providers/auth-provider";
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
  const token = cookieStore.get("accessToken")?.value;
  const permissions = getPermissionsFromToken(token);

  console.log("[AdminLayout] Data check:", {
    hasUser: !!user,
    hasToken: !!token,
    roles: user?.roles?.map((r: any) => r.role?.name),
    permissionsCount: permissions.length,
    profileError: (profile as any).error,
  });

  if (!user) {
    console.warn("[AdminLayout] No user found, redirecting to /login");
    redirect("/login");
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
