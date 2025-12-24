import { getCartCountAction } from "@/actions/cart";
import {
  getNotificationsAction,
  getUnreadCountAction,
} from "@/actions/notifications";
import { getProfileAction } from "@/actions/profile";
import { getWishlistAction } from "@/actions/wishlist";
import { SocialProofToast } from "@/components/molecules/purchase-toast";
import { ConditionalFooter } from "@/components/organisms/conditional-footer";
import { Footer } from "@/components/organisms/footer";
import { Header, HeaderFallback } from "@/components/organisms/header";
import { MobileBottomNav } from "@/components/organisms/mobile-nav";
import {
  NotificationProvider,
  type Notification,
} from "@/contexts/notification-context";
import { getPermissionsFromToken } from "@/lib/permission-utils";
import { CartProvider } from "@/providers/cart-provider";
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
  let user = null;
  let token = undefined;
  let initialCartCount = 0;
  let initialWishlistCount = 0;
  let initialNotifications: Notification[] = [];
  let initialUnreadCount = 0;
  let permissions: string[] = [];

  try {
    const cookieStore = await cookies();
    const [profile, cartRes, wishlistItems, notificationsRes, unreadCountRes] =
      await Promise.all([
        getProfileAction(),
        getCartCountAction().catch(() => ({ count: 0 })),
        getWishlistAction().catch(() => []),
        getNotificationsAction(10).catch(() => ({ data: [] })),
        getUnreadCountAction().catch(() => ({ count: 0 })),
      ]);

    user = profile.data;
    token = cookieStore.get("accessToken")?.value;
    permissions = user ? getPermissionsFromToken(token) : [];
    initialCartCount =
      user && cartRes && typeof cartRes.count === "number" ? cartRes.count : 0;
    initialWishlistCount =
      user && Array.isArray(wishlistItems) ? wishlistItems.length : 0;
    initialNotifications = (notificationsRes?.data || []) as Notification[];
    initialUnreadCount =
      unreadCountRes && typeof unreadCountRes.count === "number"
        ? unreadCountRes.count
        : 0;
  } catch (e) {
    // If cookies() or fetching fails during prerendering, we just use the default empty values.
    // This allows the static shell of the layout to be built.
  }

  return (
    <NotificationProvider
      userId={user?.id}
      initialNotifications={initialNotifications}
      initialUnreadCount={initialUnreadCount}
      accessToken={token}
    >
      <CartProvider initialCount={initialCartCount} initialUser={user}>
        <Header
          initialUser={user}
          permissions={permissions}
          initialCartCount={initialCartCount}
          initialWishlistCount={initialWishlistCount}
        />
        <main className="flex-1">{children}</main>
        <ConditionalFooter />
        <MobileBottomNav
          initialUser={user}
          initialCartCount={initialCartCount}
        />
        <SocialProofToast />
      </CartProvider>
    </NotificationProvider>
  );
}

function ShopLayoutFallback({ children }: { children: React.ReactNode }) {
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

export default async function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Suspense fallback={<ShopLayoutFallback>{children}</ShopLayoutFallback>}>
        <DynamicShopContent>{children}</DynamicShopContent>
      </Suspense>
    </div>
  );
}
