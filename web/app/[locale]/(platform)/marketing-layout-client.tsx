"use client";

import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { Link, usePathname, useRouter } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { Menu, Sparkles, Store, Settings, X, ArrowRight } from "lucide-react";
import { useTranslations, useLocale } from "next-intl";
import { useState, useTransition, useEffect } from "react";

export function MarketingLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations("marketing");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Check if user is logged in via accessToken cookie
  useEffect(() => {
    const hasToken = document.cookie.includes("accessToken=");
    setIsLoggedIn(hasToken);

    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { href: "/features", label: t("nav.features") },
    { href: "/pricing", label: t("nav.pricing") },
    { href: "/demo", label: t("nav.demo") },
    { href: "/about", label: t("nav.about") },
    { href: "/contact", label: t("nav.contact") },
  ];

  const handleLanguageChange = (newLocale: "en" | "vi") => {
    if (newLocale === locale) return;
    startTransition(() => {
      router.replace(pathname as any, { locale: newLocale, scroll: false });
    });
  };

  return (
    <div className="relative min-h-screen bg-background font-sans selection:bg-indigo-500/30">
      {/* ============================================================================
       * AURORA BACKGROUND EFFECTS (Global for Marketing)
       * ============================================================================ */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-[var(--aurora-blue)]/10 rounded-full blur-[120px]" />
        <div className="absolute top-[20%] right-[-5%] w-[400px] h-[400px] bg-[var(--aurora-purple)]/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[20%] w-[600px] h-[600px] bg-[var(--aurora-orange)]/5 rounded-full blur-[120px]" />
      </div>

      {/* Marketing Header */}
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b border-transparent",
          scrolled ? "glass border-white/10 py-3" : "bg-transparent py-5"
        )}
      >
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/landing" className="flex items-center gap-2 group">
              <div className="relative flex items-center justify-center size-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg group-hover:shadow-indigo-500/25 transition-all duration-300 group-hover:scale-110">
                <Sparkles className="size-5" />
              </div>
              <span className="font-bold text-xl tracking-tight hidden sm:block group-hover:text-primary transition-colors">
                {t("footer.brand")}
              </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "px-4 py-2 text-sm font-medium rounded-full transition-all duration-300",
                      isActive
                        ? "bg-primary/5 text-primary"
                        : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                    )}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </nav>

            {/* CTA Buttons + Language */}
            <div className="flex items-center gap-3">
              <div className="hidden md:block">
                <LanguageSwitcher />
              </div>

              {isLoggedIn ? (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                    className="hidden sm:flex gap-2 rounded-full"
                  >
                    <Link href="/shop">
                      <Store className="size-4" />
                      My Shop
                    </Link>
                  </Button>
                  <Button
                    size="sm"
                    asChild
                    className="gap-2 rounded-full btn-quiet-luxury"
                  >
                    <Link href="/admin">
                      <Settings className="size-4" />
                      Admin
                    </Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                    className="hidden sm:flex rounded-full hover:bg-white/10"
                  >
                    <Link href="/login">{t("nav.login")}</Link>
                  </Button>
                  <Button
                    size="sm"
                    asChild
                    className="rounded-full btn-quiet-luxury shadow-lg shadow-indigo-500/20"
                  >
                    <Link href="/register">
                      {t("nav.getStarted")}
                      <ArrowRight className="size-4 ml-2" />
                    </Link>
                  </Button>
                </>
              )}

              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>

          {/* Mobile Nav */}
          {mobileMenuOpen && (
            <div className="absolute top-full left-0 right-0 p-4 glass border-t border-white/10 lg:hidden animate-in slide-in-from-top-4 duration-300">
              <div className="flex flex-col gap-2">
                {navLinks.map((link) => {
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={cn(
                        "px-4 py-3 text-sm font-medium rounded-xl transition-colors",
                        isActive
                          ? "bg-primary/5 text-primary"
                          : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                      )}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {link.label}
                    </Link>
                  );
                })}
                <div className="h-px bg-border/50 my-2" />
                <div className="flex items-center justify-between px-4">
                  <span className="text-sm text-muted-foreground">
                    Language
                  </span>
                  <LanguageSwitcher />
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 pt-20">{children}</main>

      {/* Marketing Footer */}
      <footer className="relative z-10 border-t border-white/10 bg-background/50 backdrop-blur-xl mt-20">
        <div className="container mx-auto px-4 lg:px-8 py-16 lg:py-24">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8">
            {/* Brand */}
            <div className="lg:col-span-4 space-y-6">
              <Link href="/landing" className="flex items-center gap-2">
                <div className="flex items-center justify-center size-8 rounded-lg bg-primary text-primary-foreground">
                  <Sparkles className="size-4" />
                </div>
                <span className="font-bold text-2xl tracking-tight">
                  {t("footer.brand")}
                </span>
              </Link>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
                {t("footer.tagline")}
              </p>
              <div className="flex gap-4">
                {/* Social Icons Placeholder */}
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="size-8 rounded-full bg-secondary flex items-center justify-center hover:bg-primary hover:text-white transition-colors cursor-pointer"
                  >
                    <div className="size-4 bg-current rounded-full opacity-50" />
                  </div>
                ))}
              </div>
            </div>

            {/* Product */}
            <div className="lg:col-span-2 lg:col-start-6">
              <h4 className="font-bold text-xs uppercase tracking-[0.2em] mb-6 text-foreground/80">
                {t("footer.product")}
              </h4>
              <ul className="space-y-4 text-sm text-muted-foreground">
                <li>
                  <Link
                    href="/features"
                    className="hover:text-primary transition-colors"
                  >
                    {t("footer.features")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/pricing"
                    className="hover:text-primary transition-colors"
                  >
                    {t("footer.pricing")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/demo"
                    className="hover:text-primary transition-colors"
                  >
                    {t("footer.customerShowcase")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/register"
                    className="hover:text-primary transition-colors"
                  >
                    {t("footer.register")}
                  </Link>
                </li>
              </ul>
            </div>

            {/* Company */}
            <div className="lg:col-span-2">
              <h4 className="font-bold text-xs uppercase tracking-[0.2em] mb-6 text-foreground/80">
                {t("footer.company")}
              </h4>
              <ul className="space-y-4 text-sm text-muted-foreground">
                <li>
                  <Link
                    href="/about"
                    className="hover:text-primary transition-colors"
                  >
                    {t("footer.aboutUs")}
                  </Link>
                </li>
                <li>
                  <Link
                    href="/contact"
                    className="hover:text-primary transition-colors"
                  >
                    {t("footer.contact")}
                  </Link>
                </li>
                <li>
                  <span className="hover:text-primary transition-colors cursor-pointer">
                    {t("footer.techBlog")}
                  </span>
                </li>
                <li>
                  <span className="hover:text-primary transition-colors cursor-pointer">
                    {t("footer.careers")}
                  </span>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div className="lg:col-span-2">
              <h4 className="font-bold text-xs uppercase tracking-[0.2em] mb-6 text-foreground/80">
                {t("footer.legal")}
              </h4>
              <ul className="space-y-4 text-sm text-muted-foreground">
                <li>
                  <span className="hover:text-primary transition-colors cursor-pointer">
                    {t("footer.terms")}
                  </span>
                </li>
                <li>
                  <span className="hover:text-primary transition-colors cursor-pointer">
                    {t("footer.privacy")}
                  </span>
                </li>
                <li>
                  <span className="hover:text-primary transition-colors cursor-pointer">
                    {t("footer.cookies")}
                  </span>
                </li>
                <li>
                  <span className="hover:text-primary transition-colors cursor-pointer">
                    {t("footer.sla")}
                  </span>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border/50 mt-16 pt-8 flex flex-col sm:flex-row items-center justify-between gap-6">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">
              {t("footer.copyright")}
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="inline-block size-2 rounded-full bg-emerald-500 animate-pulse" />
              All Systems Operational
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
