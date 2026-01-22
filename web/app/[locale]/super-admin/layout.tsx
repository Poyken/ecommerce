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


export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken")?.value;
  const permissions = getPermissionsFromToken(token);

  // Quick initial check for SSR
  const hasSuperAdminAccess = permissions.includes("super-admin:read");

  if (!hasSuperAdminAccess) {
    redirect("/admin");
  }

  return (
    <AuthProvider initialPermissions={permissions}>
      <Suspense fallback={<LoadingScreen variant="classic" message="Initializing Platform Power..." />}>
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
