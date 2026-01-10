"use client";

import { CartBadge } from "@/features/cart/components/cart-badge";
import { WishlistBadge } from "@/features/wishlist/components/wishlist-badge";
import { Link, usePathname } from "@/i18n/routing";
import { slideInFromBottom } from "@/lib/animations";
import { cn } from "@/lib/utils";
import { m } from "@/lib/animations";
import { AnimatePresence } from "framer-motion";
import { Heart, Home, LogIn, Menu, ShoppingBag, User, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

/**
 * =====================================================================
 * MOBILE BOTTOM NAV - Thanh điều hướng dưới cùng cho Mobile
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. MOBILE-FIRST UX (Trải nghiệm ưu tiên di động):
 * - Trên điện thoại, ngón cái dễ chạm vào cạnh dưới ("Thumb Zone") hơn cạnh trên.
 * - Bottom Nav giúp trải nghiệm chuyển trang tiện lợi như Native App.
 *
 * 2. FRAMER MOTION "SHARED LAYOUT":
 * - `layoutId="activeTab"`: Magic của Framer Motion.
 * - Khi `isActive` chuyển từ tab này sang tab khác, dấu chấm tròn (indicator) sẽ "bay" sang vị trí mới thay vì ẩn/hiện thô thiển.
 *
 * 3. PORTAL & OVERLAY:
 * - Menu mở rộng ("More") sử dụng `AnimatePresence` để animate lúc mount/unmount.
 * - `safe-area-pb`: Class utility (custom) để tránh bị che bởi thanh Home Indicator của iPhone X+.
 * =====================================================================
 */

interface NavItem {
  href: string;
  icon: React.ElementType;
  label: string;
}

/**
 * MobileBottomNav - Fixed bottom navigation cho mobile devices
 * Chỉ hiển thị trên màn hình < 768px (md breakpoint)
 */
interface MobileBottomNavProps {
  initialUser?: any;
  initialCartCount?: number;
  initialWishlistCount?: number;
}

export function MobileBottomNav({
  initialUser,
  initialCartCount,
  initialWishlistCount,
}: MobileBottomNavProps) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const navItems: NavItem[] = [
    { href: "/", icon: Home, label: t("home") },
    { href: "/shop", icon: ShoppingBag, label: t("shop") },
    { href: "/cart", icon: ShoppingBag, label: t("cart") },
    initialUser
      ? { href: "/profile", icon: User, label: t("profile") }
      : { href: "/login", icon: LogIn, label: t("login") || "Login" },
  ];

  return (
    <>
      {/* Bottom Navigation Bar */}
      <nav
        data-fixed-element
        className="fixed bottom-0 left-0 right-0 z-102 md:hidden bg-background/98 backdrop-blur-2xl border-t border-foreground/5 safe-area-pb shadow-2xl"
      >
        <div className="flex items-center justify-around h-16 px-2">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href as any}
                className={cn(
                  "flex flex-col items-center justify-center gap-1.5 px-3 py-2 rounded-2xl transition-all duration-300",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground/60 hover:text-foreground active:scale-95"
                )}
              >
                <div className="relative">
                  {item.label === t("cart") ? (
                    <>
                      <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                      <CartBadge />
                    </>
                  ) : (
                    <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                  )}
                  {isActive && (
                    <m.div
                      layoutId="activeTab"
                      className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-primary shadow-lg shadow-primary/50"
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 30,
                      }}
                    />
                  )}
                </div>
                <span
                  className={cn(
                    "text-[10px] font-bold uppercase tracking-wider",
                    isActive && "text-primary"
                  )}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}

          {/* Menu Button */}
          <button
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className="flex flex-col items-center justify-center gap-1.5 px-3 py-2 rounded-2xl text-muted-foreground/60 hover:text-foreground transition-all duration-300 active:scale-95"
          >
            {isSearchOpen ? (
              <X size={24} strokeWidth={2} />
            ) : (
              <Menu size={24} strokeWidth={2} />
            )}
            <span className="text-[10px] font-bold uppercase tracking-wider">
              {t("more") || "More"}
            </span>
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isSearchOpen && (
          <>
            {/* Backdrop */}
            <m.div
              data-fixed-element
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-100 bg-black/60 backdrop-blur-sm md:hidden"
              onClick={() => setIsSearchOpen(false)}
            />

            {/* Menu Sheet */}
            <m.div
              data-fixed-element
              variants={slideInFromBottom}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="fixed bottom-16 left-0 right-0 z-101 bg-background/98 backdrop-blur-2xl rounded-t-4xl border-t border-foreground/5 p-8 pb-12 overflow-y-auto max-h-[85vh] space-y-6 md:hidden safe-area-pb shadow-2xl"
            >
              <div className="w-16 h-1.5 bg-foreground/10 rounded-full mx-auto mb-6" />

              <h3 className="font-black text-xl mb-6 tracking-tight uppercase">
                {t("quickLinks") || "Quick Links"}
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <Link
                  href="/wishlist"
                  onClick={() => setIsSearchOpen(false)}
                  className="relative flex items-center justify-center p-5 rounded-2xl bg-foreground/2 border border-foreground/5 text-sm font-bold uppercase tracking-wide hover:bg-foreground/5 hover:border-primary/20 transition-all duration-300 active:scale-95"
                >
                  <span className="flex items-center gap-2">
                    <Heart size={18} />
                    {t("wishlist") || "Wishlist"}
                  </span>
                  <WishlistBadge
                    initialUser={initialUser}
                    initialCount={initialWishlistCount}
                  />
                </Link>

                {[
                  { href: "/shop", label: t("search") || "Search" },
                  {
                    href: "/notifications",
                    label: t("notifications") || "Notifications",
                  },
                  ...(initialUser
                    ? [{ href: "/orders", label: t("orders") }]
                    : []),
                  { href: "/about", label: t("about") },
                  { href: "/blog", label: t("journal") },
                  { href: "/contact", label: t("contact") },
                ].map((link) => (
                  <Link
                    key={link.href}
                    href={link.href as any}
                    onClick={() => setIsSearchOpen(false)}
                    className="flex items-center justify-center p-5 rounded-2xl bg-foreground/2 border border-foreground/5 text-sm font-bold uppercase tracking-wide hover:bg-foreground/5 hover:border-primary/20 transition-all duration-300 active:scale-95"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </m.div>
          </>
        )}
      </AnimatePresence>

      {/* Spacer to prevent content from being hidden behind bottom nav */}
      <div className="h-16 md:hidden" aria-hidden="true" />
    </>
  );
}
