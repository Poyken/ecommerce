import { ClientOnlyWidgets } from "@/components/shared/client-only-widgets";
import { ErrorBoundary } from "@/components/shared/error-boundary";
import { getCartCountAction } from "@/features/cart/actions";
import { CartInitializer } from "@/features/cart/components/cart-initializer";
import { ConditionalFooter } from "@/features/layout/components/conditional-footer";
import { ConditionalHeader } from "@/features/layout/components/conditional-header";
import { Footer } from "@/features/layout/components/footer";
import { HeaderFallback } from "@/features/layout/components/header";
import { MobileBottomNav } from "@/features/layout/components/mobile-nav";
import {
    getNotificationsAction,
    getUnreadCountAction,
} from "@/features/notifications/actions";
import { NotificationInitializer } from "@/features/notifications/components/notification-initializer";
import { getProfileAction } from "@/features/profile/actions";
import { getWishlistAction } from "@/features/wishlist/actions";
import { getPermissionsFromToken } from "@/lib/permission-utils";
import { type Notification } from "@/types/models";
import { cookies } from "next/headers";
import { Suspense } from "react";

import Loading from "./loading";

/**
 * =====================================================================
 * SHOP LAYOUT - Layout chính cho phần mua sắm
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * ROUTE GROUPS `(shop)`:
 * - Thư mục có tên trong ngoặc `()` không ảnh hưởng đến URL path.
 * - Ví dụ: `app/(shop)/page.tsx` -> URL `/`
 * - Mục đích: Để nhóm các trang có cùng Layout lại với nhau (Header, Footer).
 * - Tách biệt với `(auth)` (Login/Register) hoặc `admin` (Dashboard) có layout khác.
 *
 * DATA FETCHING OPTIMIZATION:
 * - Tất cả dynamic data (user, permissions) được fetch MỘT LẦN trong DynamicShopContent.
 * - Sau đó pass xuống các component con (Header, MobileNav).
 * - Tránh gọi API nhiều lần từ các Suspense boundaries khác nhau.
 * =====================================================================
 */

async function DynamicShopContent({ children }: { children: React.ReactNode }) {
  // Fetch user data ONCE for the entire layout
  // We also try to fetch cart and wishlist counts securely on the server to avoid client waterfalls
  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken")?.value;

  let user = null;
  let initialCartCount = 0;
  let initialWishlistCount = 0;
  let initialNotifications: Notification[] = [];
  let initialUnreadCount = 0;
  let permissions: string[] = [];

  try {
    if (token) {
      const [
        profile,
        cartRes,
        wishlistItems,
        notificationsRes,
        unreadCountRes,
      ] = await Promise.all([
        getProfileAction().catch(() => ({ data: null, error: null })),
        getCartCountAction().catch(() => ({ count: 0 })),
        getWishlistAction().catch(() => []),
        getNotificationsAction(10).catch(() => ({ data: [] })),
        getUnreadCountAction().catch(() => ({ count: 0 })),
      ]);

      user = profile.data;
      permissions = user ? getPermissionsFromToken(token) : [];
      initialCartCount =
        user && cartRes && typeof cartRes.count === "number"
          ? cartRes.count
          : 0;
      initialWishlistCount =
        user && Array.isArray(wishlistItems) ? wishlistItems.length : 0;
      initialNotifications = (notificationsRes?.data || []) as Notification[];
      initialUnreadCount =
        unreadCountRes && typeof unreadCountRes.count === "number"
          ? unreadCountRes.count
          : 0;
    }
  } catch (_e) {
    // Falls back to defaults
  }

  return (
    <>
      <NotificationInitializer
        userId={user?.id}
        initialNotifications={initialNotifications}
        initialUnreadCount={initialUnreadCount}
        accessToken={token}
      />
      <CartInitializer initialCount={initialCartCount} initialUser={user} />
      <ConditionalHeader
        initialUser={user}
        permissions={permissions}
        initialCartCount={initialCartCount}
        initialWishlistCount={initialWishlistCount}
      />
      <main className="flex-1">
        <ErrorBoundary name="ShopContent">{children}</ErrorBoundary>
      </main>
      <ConditionalFooter />
      <MobileBottomNav
        initialUser={user}
        initialCartCount={initialCartCount}
        initialWishlistCount={initialWishlistCount}
      />
      <ClientOnlyWidgets user={user} accessToken={token} />
    </>
  );
}

function ShopLayoutFallback() {
  return (
    <>
      <HeaderFallback />
      <main className="flex-1">
        <Loading />
      </main>
      <Footer />
    </>
  );
}

import { LayoutVisibilityProvider } from "@/features/layout/providers/layout-visibility-provider";

export default async function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <LayoutVisibilityProvider>
        <div className="flex min-h-screen flex-col">
          <Suspense fallback={<ShopLayoutFallback />}>
            {/* Force Rebuild */}
            <DynamicShopContent>{children}</DynamicShopContent>
          </Suspense>
        </div>
    </LayoutVisibilityProvider>
  );
}
