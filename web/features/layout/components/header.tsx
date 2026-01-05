import { StickyHeader } from "@/components/shared/sticky-header";
import { Skeleton } from "@/components/ui/skeleton";
import { CartBadge } from "@/features/cart/components/cart-badge";
import { HeaderActions } from "@/features/layout/components/header-actions";
import { HeaderNav } from "@/features/layout/components/header-nav";
import { Logo } from "@/features/layout/components/logo";
import { NotificationBell } from "@/features/notifications/components/notification-bell";
import { WishlistBadge } from "@/features/wishlist/components/wishlist-badge";
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
 * 1. CHIẾN LƯỢC FETCH DATA (Data Fetching Strategy):
 * - Vấn đề: Header cần thông tin User, Cart, Wishlist.
 * - Sai lầm thường gặp: Fetch API trực tiếp trong Header -> Gây ra "Waterfall" (Layout fetch xong mới render Header -> Header mới fetch).
 * - Giải pháp: Fetch dữ liệu ở tầng cao nhất (`layout.tsx`) và truyền xuống qua Props.
 *   -> Header trở thành "Dumb Component" (chỉ nhận và hiển thị), giúp render cực nhanh.
 *
 * 2. COMPOSITION PATTERN:
 * - Header không tự làm mọi thứ. Nó ghép nối các components nhỏ hơn:
 *   + `HeaderNav`: Menu điều hướng.
 *   + `HeaderActions`: Login/Logout/Profile menu.
 *   + `CartBadge`, `WishlistBadge`: Icon kèm số lượng.
 * - Giúp code gọn gàng, dễ bảo trì.
 *
 * 3. FALLBACK & SKELETON:
 * - `HeaderFallback`: Hiển thị khung xương khi component động đang load.
 * - Ngăn chặn Layout Shift (CLS) - hiện tượng giao diện bị giật cục khi load.
 * =====================================================================
 */

interface HeaderProps {
  initialUser?: any; // Thông tin user (được truyền từ server component cha)
  permissions?: string[]; // Quyền hạn (RBAC)
  initialCartCount?: number;
  initialWishlistCount?: number;
  isInline?: boolean;
}

/**
 * Skeleton Placeholder
 * - Mô phỏng chính xác cấu trúc của Header thật.
 * - Giữ chỗ để layout không bị nhảy khi hydration xảy ra.
 */
function HeaderContentSkeleton() {
  return (
    <>
      {/* Nav skeleton - Phải khớp với HeaderNav */}
      <nav className="hidden md:flex items-center gap-6">
        <Skeleton className="w-16 h-5 rounded" />
        <Skeleton className="w-12 h-5 rounded" />
        <Skeleton className="w-14 h-5 rounded" />
        <Skeleton className="w-16 h-5 rounded" />
        <Skeleton className="w-14 h-5 rounded" />
      </nav>
      {/* Actions skeleton - Phải khớp với cụm bên phải */}
      <div className="flex items-center gap-4">
        <Skeleton className="w-9 h-9 rounded-full" />
        <Skeleton className="w-9 h-9 rounded-full" />
        <Skeleton className="w-10 h-10 rounded-full" />
      </div>
    </>
  );
}

/**
 * Header Fallback Component
 * - Được sử dụng trong `loading.tsx` hoặc `Suspense` boundary.
 */
export function HeaderFallback() {
  return (
    <header
      data-fixed-element
      className="border-b bg-background/80 backdrop-blur-xl supports-backdrop-filter:bg-background/60 w-full z-50 sticky top-0 transition-[background-color,border-color,transform,box-shadow,backdrop-filter] duration-300"
    >
      <div className="container flex h-20 items-center justify-between max-w-7xl mx-auto px-4 md:px-8">
        <Logo />
        <HeaderContentSkeleton />
      </div>
    </header>
  );
}

/**
 * Main Header Component
 */
export function Header({
  initialUser,
  permissions,
  initialCartCount,
  initialWishlistCount,
  isInline = false,
}: HeaderProps) {
  const t = useTranslations("common");

  return (
    // StickyHeader: Wrapper xử lý sự kiện cuộn trang (ẩn hiện header)
    <StickyHeader isInline={isInline} className="border-b bg-background/80 backdrop-blur-xl supports-backdrop-filter:bg-background/60 z-50 transition-all duration-500">
      <div className="container flex h-20 items-center justify-between max-w-7xl mx-auto px-4 md:px-8">
        {/* 1. Logo Brand */}
        <Logo />

        {/* 2. Main Navigation (Truyền props User xuống để quyết định hiện menu Admin hay không) */}
        <HeaderNav initialUser={initialUser} permissions={permissions} />

        {/* 3. Right Actions (Wishlist, Cart, Profile) */}
        <div className="flex items-center gap-2 md:gap-4">
          {/* Wishlist Button */}
          <Link
            href="/wishlist"
            className="hidden md:flex transition-all hover:text-primary text-foreground/70 relative w-10 h-10 items-center justify-center hover:bg-neutral-100 dark:hover:bg-white/5 rounded-full group"
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

          {/* Cart Button with Prefetching */}
          <Link
            href="/cart"
            prefetch={true} // Tải trước trang Cart ngay khi hover -> Tăng tốc độ chuyển trang
            className="hidden md:flex transition-all hover:text-primary text-foreground/70 relative w-10 h-10 items-center justify-center hover:bg-neutral-100 dark:hover:bg-white/5 rounded-full group"
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

          <div className="hidden md:block h-6 w-px bg-foreground/10 mx-1" />

          {/* Notification & User Actions */}
          <NotificationBell />
          <HeaderActions initialUser={initialUser} permissions={permissions} />
        </div>
      </div>
    </StickyHeader>
  );
}
