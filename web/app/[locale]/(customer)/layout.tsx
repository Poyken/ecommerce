import { ClientOnlyWidgets } from "@/features/layout/components/client-only-widgets";
import { ErrorBoundary } from "@/components/shared/error-boundary";
import { CartInitializer } from "@/features/cart/components/cart-initializer";
import { ConditionalFooter } from "@/features/layout/components/conditional-footer";
import { ConditionalHeader } from "@/features/layout/components/conditional-header";
import { Footer } from "@/features/layout/components/footer";
import { HeaderFallback } from "@/features/layout/components/header";
import { MobileBottomNav } from "@/features/layout/components/mobile-nav";
import { NotificationInitializer } from "@/features/notifications/components/notification-initializer";
import { getProfileAction } from "@/features/profile/actions";
import { getPermissionsFromToken } from "@/lib/permission-utils";
import { cookies } from "next/headers";
import { Suspense } from "react";
import Loading from "./loading";

/**
 * SHOP LAYOUT - Main layout for the shopping experience.
 */

async function DynamicShopContent({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken")?.value;

  let user = null;
  let permissions: string[] = [];

  try {
    if (token) {
      // Fetch ONLY the profile to identify the user for Header/Nav
      const profileRes = await getProfileAction();
      user = profileRes.success ? profileRes.data : null;
      permissions = user ? getPermissionsFromToken(token) : [];
    }
  } catch {
    // Falls back to defaults
  }

  return (
    <>
      {/* 
        Initializer components handle granular data syncing (Cart, Wishlist, Notifications).
        They are non-blocking as they run on the client or fetch data asynchronously.
      */}
      <NotificationInitializer userId={user?.id} accessToken={token} />
      <CartInitializer initialUser={user} />
      
      <ConditionalHeader
        initialUser={user}
        permissions={permissions}
      />
      
      <main className="flex-1">
        <ErrorBoundary name="ShopContent">{children}</ErrorBoundary>
      </main>
      
      <ConditionalFooter />
      <MobileBottomNav initialUser={user} />
      <ClientOnlyWidgets user={user as any} accessToken={token} />
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
          <DynamicShopContent>{children}</DynamicShopContent>
        </Suspense>
      </div>
    </LayoutVisibilityProvider>
  );
}

