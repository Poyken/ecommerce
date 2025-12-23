import { Logo } from "@/components/atoms/logo";
import { Skeleton } from "@/components/atoms/skeleton";
import { CartBadge } from "@/components/molecules/cart-badge";
import { HeaderActions } from "@/components/molecules/header-actions";
import { HeaderNav } from "@/components/molecules/header-nav";
import { NotificationBell } from "@/components/molecules/notification-bell";
import { StickyHeader } from "@/components/molecules/sticky-header";
import { WishlistBadge } from "@/components/molecules/wishlist-badge";
import { Link } from "@/i18n/routing";
import { Heart, ShoppingCart } from "lucide-react";
import { useTranslations } from "next-intl";

/**
 * =====================================================================
 * HEADER COMPONENT - Thanh điều hướng chính
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. PROPS-BASED RENDERING:
 * - Header nhận user và permissions từ Layout (đã fetch sẵn).
 * - Tránh duplicate API calls bằng cách không fetch dữ liệu trong component này.
 * - Layout fetch MỘT LẦN và pass xuống tất cả components con.
 *
 * 2. STATIC SHELL:
 * - Logo luôn render static.
 * - Nav, Cart, Actions render dựa trên props.
 * =====================================================================
 */

interface HeaderProps {
  initialUser?: any;
  permissions?: string[];
  initialCartCount?: number;
  initialWishlistCount?: number;
}

/**
 * Skeleton placeholder for dynamic header content.
 * Must match the exact structure of Header content to prevent layout shift.
 */
function HeaderContentSkeleton() {
  return (
    <>
      {/* Nav skeleton - matches HeaderNav structure */}
      <nav className="hidden md:flex items-center gap-6">
        <Skeleton className="w-16 h-5 rounded" />
        <Skeleton className="w-12 h-5 rounded" />
        <Skeleton className="w-14 h-5 rounded" />
        <Skeleton className="w-16 h-5 rounded" />
        <Skeleton className="w-14 h-5 rounded" />
      </nav>
      {/* Actions skeleton - matches cart + actions structure */}
      <div className="flex items-center gap-4">
        <Skeleton className="w-9 h-9 rounded-full" />
        <Skeleton className="w-9 h-9 rounded-full" />
        <Skeleton className="w-10 h-10 rounded-full" />
      </div>
    </>
  );
}

export function HeaderFallback() {
  return (
    <header className="border-b bg-background/80 backdrop-blur-xl supports-backdrop-filter:bg-background/60 w-full z-50 sticky top-0 transition-all duration-300">
      <div className="container flex h-20 items-center justify-between max-w-7xl mx-auto px-4 md:px-8">
        <Logo />
        <HeaderContentSkeleton />
      </div>
    </header>
  );
}

export function Header({
  initialUser,
  permissions,
  initialCartCount,
  initialWishlistCount,
}: HeaderProps) {
  const t = useTranslations("common");

  return (
    <StickyHeader className="border-b bg-background/80 backdrop-blur-xl supports-backdrop-filter:bg-background/60 z-50 transition-all duration-500">
      <div className="container flex h-20 items-center justify-between max-w-7xl mx-auto px-4 md:px-8">
        <Logo />

        <HeaderNav initialUser={initialUser} permissions={permissions} />

        <div className="flex items-center gap-2 md:gap-4">
          <Link
            href="/wishlist"
            className="transition-all hover:text-primary text-foreground/70 relative w-10 h-10 flex items-center justify-center hover:bg-neutral-100 dark:hover:bg-white/5 rounded-full group"
            title={t("wishlist")}
          >
            <span className="relative inline-flex">
              <Heart
                size={22}
                className="group-hover:scale-110 transition-transform"
              />
              <WishlistBadge
                initialUser={initialUser}
                initialCount={initialWishlistCount}
              />
            </span>
          </Link>
          <Link
            href="/cart"
            className="transition-all hover:text-primary text-foreground/70 relative w-10 h-10 flex items-center justify-center hover:bg-neutral-100 dark:hover:bg-white/5 rounded-full group"
          >
            <span className="relative inline-flex">
              <ShoppingCart
                size={22}
                className="group-hover:scale-110 transition-transform"
              />
              <CartBadge
                initialUser={initialUser}
                initialCount={initialCartCount}
              />
            </span>
          </Link>
          <div className="hidden sm:block h-6 w-px bg-foreground/10 mx-1" />
          <NotificationBell />
          <HeaderActions initialUser={initialUser} />
        </div>
      </div>
    </StickyHeader>
  );
}
