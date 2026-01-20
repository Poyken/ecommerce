"use client";

import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/shared/language-switcher";
import { Link, usePathname, useRouter } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { Menu, Sparkles, Store, Settings, X } from "lucide-react";
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

  // Check if user is logged in via accessToken cookie
  useEffect(() => {
    const hasToken = document.cookie.includes("accessToken=");
    setIsLoggedIn(hasToken);
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
    <>
      {/* Marketing Header */}
      <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Logo */}
            <Link href="/landing" className="flex items-center gap-2">
              <Sparkles className="size-6 text-primary" />
              <span className="font-bold text-xl">{t("footer.brand")}</span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* CTA Buttons + Language */}
            <div className="flex items-center gap-3">
              <LanguageSwitcher />
              
              {isLoggedIn ? (
                <>
                  {/* Logged-in user: Show My Shop and Admin buttons */}
                  <Button
                    variant="outline"
                    size="sm"
                    asChild
                    className="hidden sm:flex gap-2"
                  >
                    <Link href="/shop">
                      <Store className="size-4" />
                      My Shop
                    </Link>
                  </Button>
                  <Button size="sm" asChild className="gap-2">
                    <Link href="/admin">
                      <Settings className="size-4" />
                      Admin
                    </Link>
                  </Button>
                </>
              ) : (
                <>
                  {/* Guest: Show Login and Get Started buttons */}
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                    className="hidden sm:flex"
                  >
                    <Link href="/login">{t("nav.login")}</Link>
                  </Button>
                  <Button size="sm" asChild>
                    <Link href="/register">{t("nav.getStarted")}</Link>
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
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
          
          {/* Mobile Nav */}
          {mobileMenuOpen && (
            <nav className="lg:hidden py-4 border-t border-border/50">
              <div className="flex flex-col gap-2">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </nav>
          )}
        </div>
      </header>

      {/* Main Content */}
      {children}

      {/* Marketing Footer */}
      <footer className="bg-secondary/30 border-t border-border mt-20">
        <div className="container mx-auto px-4 lg:px-8 py-16 lg:py-24">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8">
            {/* Brand */}
            <div className="lg:col-span-4 space-y-6">
              <Link href="/landing" className="flex items-center gap-2">
                <Sparkles className="size-6 text-primary" />
                <span className="font-bold text-2xl tracking-tight">
                  {t("footer.brand")}
                </span>
              </Link>
              <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
                {t("footer.tagline")}
              </p>
            </div>

            {/* Product */}
            <div className="lg:col-span-2 lg:col-start-6">
              <h4 className="font-bold text-xs uppercase tracking-[0.2em] mb-6">
                {t("footer.product")}
              </h4>
              <ul className="space-y-4 text-sm text-muted-foreground">
                <li>
                  <Link href="/features" className="hover:text-primary transition-colors">
                    {t("footer.features")}
                  </Link>
                </li>
                <li>
                  <Link href="/pricing" className="hover:text-primary transition-colors">
                    {t("footer.pricing")}
                  </Link>
                </li>
                <li>
                  <Link href="/demo" className="hover:text-primary transition-colors">
                    {t("footer.customerShowcase")}
                  </Link>
                </li>
                <li>
                  <Link href="/register" className="hover:text-primary transition-colors">
                    {t("footer.register")}
                  </Link>
                </li>
              </ul>
            </div>

            {/* Company */}
            <div className="lg:col-span-2">
              <h4 className="font-bold text-xs uppercase tracking-[0.2em] mb-6">
                {t("footer.company")}
              </h4>
              <ul className="space-y-4 text-sm text-muted-foreground">
                <li>
                  <Link href="/about" className="hover:text-primary transition-colors">
                    {t("footer.aboutUs")}
                  </Link>
                </li>
                <li>
                  <Link href="/contact" className="hover:text-primary transition-colors">
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
              <h4 className="font-bold text-xs uppercase tracking-[0.2em] mb-6">
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

          <div className="border-t border-border mt-16 pt-8 flex flex-col sm:flex-row items-center justify-center gap-6">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">
              {t("footer.copyright")}
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
