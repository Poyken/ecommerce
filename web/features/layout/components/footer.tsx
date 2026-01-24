"use client";

import { Logo } from "@/features/layout/components/logo";
import { Link, usePathname } from "@/i18n/routing";
import { TypedLink, appRoutes } from "@/lib/typed-navigation";
import { Facebook, Instagram, Twitter, Youtube } from "lucide-react";


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
    <footer className="relative bg-black text-white pt-24 pb-12 overflow-hidden border-t border-white/5">
      {/* Background Depth - Deep Aurora Glows */}
      <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-[var(--aurora-purple)]/5 rounded-full blur-[150px] pointer-events-none opacity-40 shrink-0" />
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-[var(--aurora-blue)]/5 rounded-full blur-[150px] pointer-events-none opacity-30 shrink-0" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/2 rounded-full blur-[200px] pointer-events-none shrink-0" />

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
                <TypedLink
                  key={i}
                  href="#"
                  className="w-12 h-12 rounded-2xl border border-white/10 bg-white/5 flex items-center justify-center text-neutral-400 hover:text-white hover:border-primary/50 hover:bg-primary/10 transition-all duration-500 group shadow-xl"
                >
                  <Icon
                    size={20}
                    className="group-hover:scale-110 transition-transform"
                  />
                </TypedLink>
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
                { label: t("collections"), href: appRoutes.shop },
              ].map((item) => (
                <li key={item.label}>
                  <TypedLink
                    href={item.href as any} // Params supported via string pattern in AppRoute
                    className="text-muted-foreground hover:text-accent transition-colors text-sm font-medium"
                  >
                    {item.label}
                  </TypedLink>
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
                { label: t("careGuide"), href: "/care-guide" },
                { label: t("trackOrder"), href: appRoutes.orders }, // Was /orders, mapped to profile orders
                { label: t("faq"), href: "#" },
              ].map((item) => (
                <li key={item.label}>
                  <TypedLink
                    href={item.href as any}
                    className="text-muted-foreground hover:text-accent transition-colors text-sm font-medium"
                  >
                    {item.label}
                  </TypedLink>
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
                { label: t("aboutUs"), href: appRoutes.about },
                { label: t("careers"), href: "#" },
                { label: t("sustainability"), href: "#" },
                { label: t("press"), href: "#" },
                { label: t("contact"), href: appRoutes.contact },
              ].map((item) => (
                <li key={item.label}>
                  <TypedLink
                    href={item.href as any}
                    className="text-muted-foreground hover:text-accent transition-colors text-sm font-medium"
                  >
                    {item.label}
                  </TypedLink>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-10 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">
          <p className="font-sans italic">&copy; 2024 LUXE.STYLING. {t("rightsReserved")}</p>
          <div className="flex gap-8">
            <TypedLink href="#" className="hover:text-primary transition-colors duration-300">
              {t("privacyPolicy")}
            </TypedLink>
            <TypedLink href="#" className="hover:text-primary transition-colors duration-300">
              {t("termsOfService")}
            </TypedLink>
            <TypedLink href="#" className="hover:text-primary transition-colors duration-300">
              {t("cookiePolicy")}
            </TypedLink>
          </div>
        </div>
      </div>
    </footer>
  );
}
