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
