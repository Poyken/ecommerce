"use client";

import { Logo } from "@/components/atoms/logo";
import { Link, usePathname } from "@/i18n/routing";
import { Facebook, Instagram, Twitter, Youtube } from "lucide-react";

/**
 * =====================================================================
 * FOOTER COMPONENT - Chân trang
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. CONDITIONAL RENDERING:
 * - Footer không cần hiển thị ở các trang tập trung vào hành động (Checkout, Login...).
 * - Dùng `usePathname` để check URL và return `null` nếu cần ẩn.
 *
 * 2. CSS GRID LAYOUT:
 * - Sử dụng Grid System của Tailwind để chia cột linh hoạt.
 * - `grid-cols-1` (Mobile) -> `md:grid-cols-2` (Tablet) -> `lg:grid-cols-12` (Desktop).
 * - `lg:col-span-4`: Chiếm 4/12 cột (1/3 chiều rộng).
 *
 * 3. VISUAL EFFECTS:
 * - Các thẻ `div` absolute với `blur-[120px]` tạo hiệu ứng nền phát sáng (Glow Effect) hiện đại.
 * =====================================================================
 */
import { useTranslations } from "next-intl";

export function Footer() {
  const t = useTranslations("footer");
  const pathname = usePathname();
  // Hide footer on order detail pages
  if (
    pathname.startsWith("/orders/") ||
    pathname.startsWith("/cart") ||
    pathname.startsWith("/checkout")
  ) {
    return null;
  }

  return (
    <footer className="relative bg-[#1A1612] text-white pt-24 pb-12 overflow-hidden">
      {/* Background Depth - Terracotta warm glow effects */}
      <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-accent/6 rounded-full blur-[150px] pointer-events-none opacity-40" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-accent/4 rounded-full blur-[150px] pointer-events-none opacity-30" />

      <div className="container mx-auto px-4 md:px-8 relative z-10 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-16 lg:gap-8 mb-20">
          {/* Brand & Socials */}
          <div className="lg:col-span-4 space-y-8">
            <Logo size="lg" />
            <p className="text-muted-foreground leading-relaxed max-w-sm text-sm font-medium">
              {t("description")}
            </p>
            <div className="flex gap-4">
              {[Facebook, Instagram, Twitter, Youtube].map((Icon, i) => (
                <Link
                  key={i}
                  href="#"
                  className="w-12 h-12 rounded-2xl border border-white/5 bg-white/5 flex items-center justify-center text-neutral-400 hover:text-white hover:border-white/20 hover:bg-white/10 transition-all duration-300 group"
                >
                  <Icon
                    size={20}
                    className="group-hover:scale-110 transition-transform"
                  />
                </Link>
              ))}
            </div>
          </div>

          {/* Links Column 1 */}
          <div className="lg:col-span-2 lg:col-start-6">
            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-white mb-8">
              {t("shop")}
            </h4>
            <ul className="space-y-4">
              {[
                { label: t("newArrivals"), href: "/shop?sort=newest" },
                { label: t("bestSellers"), href: "/shop?sort=popular" },
                {
                  label: t("accessories"),
                  href: "/shop?categoryId=accessories",
                },
                { label: t("sale"), href: "/shop?sort=sale" },
                { label: t("collections"), href: "/shop" },
              ].map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href as any}
                    className="text-muted-foreground hover:text-accent transition-colors text-sm font-medium"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Links Column 2 */}
          <div className="lg:col-span-2">
            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-white mb-8">
              {t("support")}
            </h4>
            <ul className="space-y-4">
              {[
                { label: t("helpCenter"), href: "#" },
                { label: t("shippingReturns"), href: "#" },
                { label: t("sizeGuide"), href: "#" },
                { label: t("trackOrder"), href: "/orders" },
                { label: t("faq"), href: "#" },
              ].map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href as any}
                    className="text-muted-foreground hover:text-accent transition-colors text-sm font-medium"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Links Column 3 */}
          <div className="lg:col-span-2">
            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-white mb-8">
              {t("company")}
            </h4>
            <ul className="space-y-4">
              {[
                { label: t("aboutUs"), href: "/about" },
                { label: t("careers"), href: "#" },
                { label: t("sustainability"), href: "#" },
                { label: t("press"), href: "#" },
                { label: t("contact"), href: "/contact" },
              ].map((item) => (
                <li key={item.label}>
                  <Link
                    href={item.href as any}
                    className="text-muted-foreground hover:text-accent transition-colors text-sm font-medium"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60">
          <p>&copy; 2024 LUXE Inc. {t("rightsReserved")}</p>
          <div className="flex gap-8">
            <Link href="#" className="hover:text-white transition-colors">
              {t("privacyPolicy")}
            </Link>
            <Link href="#" className="hover:text-white transition-colors">
              {t("termsOfService")}
            </Link>
            <Link href="#" className="hover:text-white transition-colors">
              {t("cookiePolicy")}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
