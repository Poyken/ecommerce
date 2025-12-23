"use client";

import { CartBadge } from "@/components/molecules/cart-badge";
import { Link, usePathname } from "@/i18n/routing";
import { slideInFromBottom } from "@/lib/animations";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { Home, Menu, ShoppingBag, User, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

/**
 * =====================================================================
 * MOBILE BOTTOM NAV - Thanh điều hướng dưới cùng cho Mobile
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. MOBILE-FIRST UX:
 * - Trên điện thoại, ngón cái dễ chạm vào cạnh dưới hơn cạnh trên.
 * - Bottom Nav giúp trải nghiệm chuyển trang giống như một ứng dụng Native App.
 *
 * 2. SHARED LAYOUT ANIMATION (`layoutId`):
 * - `layoutId="activeTab"`: Khi chuyển tab, chấm tròn nhỏ ở dưới icon sẽ trượt mượt mà từ tab cũ sang tab mới.
 * - Đây là một tính năng cực mạnh của Framer Motion để tạo hiệu ứng "Shared Element".
 *
 * 3. OVERLAY MENU:
 * - Nút "More" mở ra một `AnimatePresence` overlay chứa các link phụ.
 * - `safe-area-pb`: Đảm bảo không bị che bởi thanh điều hướng của hệ điều hành (iOS/Android).
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
}

export function MobileBottomNav({ initialUser, initialCartCount }: MobileBottomNavProps) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const navItems: NavItem[] = [
    { href: "/", icon: Home, label: t("home") },
    { href: "/shop", icon: ShoppingBag, label: t("shop") },
    { href: "/cart", icon: ShoppingBag, label: t("cart") },
    { href: "/profile", icon: User, label: t("profile") },
  ];

  return (
    <>
      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-[102] md:hidden bg-background/98 backdrop-blur-2xl border-t border-foreground/5 safe-area-pb shadow-2xl">
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
                      <CartBadge initialUser={initialUser} initialCount={initialCartCount} />
                    </>
                  ) : (
                    <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                  )}
                  {isActive && (
                    <motion.div
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
                <span className={cn(
                  "text-[10px] font-bold uppercase tracking-wider",
                  isActive && "text-primary"
                )}>{item.label}</span>
              </Link>
            );
          })}

          {/* Menu Button */}
          <button
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className="flex flex-col items-center justify-center gap-1.5 px-3 py-2 rounded-2xl text-muted-foreground/60 hover:text-foreground transition-all duration-300 active:scale-95"
          >
            {isSearchOpen ? <X size={24} strokeWidth={2} /> : <Menu size={24} strokeWidth={2} />}
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
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm md:hidden"
              onClick={() => setIsSearchOpen(false)}
            />

            {/* Menu Sheet */}
            <motion.div
              variants={slideInFromBottom}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="fixed bottom-16 left-0 right-0 z-[101] bg-background/98 backdrop-blur-2xl rounded-t-[2rem] border-t border-foreground/5 p-8 space-y-6 md:hidden safe-area-pb shadow-2xl"
            >
              <div className="w-16 h-1.5 bg-foreground/10 rounded-full mx-auto mb-6" />

              <h3 className="font-black text-xl mb-6 tracking-tight uppercase">
                {t("quickLinks") || "Quick Links"}
              </h3>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { href: "/about", label: t("about") },
                  { href: "/blog", label: t("journal") },
                  { href: "/contact", label: t("contact") },
                  { href: "/orders", label: t("orders") },
                ].map((link) => (
                  <Link
                    key={link.href}
                    href={link.href as any}
                    onClick={() => setIsSearchOpen(false)}
                    className="flex items-center justify-center p-5 rounded-2xl bg-foreground/[0.02] border border-foreground/5 text-sm font-bold uppercase tracking-wide hover:bg-foreground/[0.05] hover:border-primary/20 transition-all duration-300 active:scale-95"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Spacer to prevent content from being hidden behind bottom nav */}
      <div className="h-16 md:hidden" aria-hidden="true" />
    </>
  );
}
