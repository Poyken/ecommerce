"use client";

import { Link, usePathname } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";
import {
  BookOpen,
  Home,
  Info,
  Phone,
  ShieldCheck,
  ShoppingBag,
} from "lucide-react";

/**
 * =====================================================================
 * HEADER NAV - Menu điều hướng chính trên Desktop
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. ACTIVE LINK HIGHLIGHTING:
 * - Sử dụng `usePathname` để biết user đang ở trang nào.
 * - `pathname === link.href` (Exact) hoặc `pathname.startsWith(link.href)` (Prefix).
 * - Hiển thị gạch chân (`after:w-full`) cho link đang active.
 *
 * 2. CONDITIONAL LINKS (RBAC):
 * - `Orders`: Chỉ hiển thị nếu user đã đăng nhập.
 * - `Admin`: Chỉ hiển thị nếu user có quyền `admin:read`.
 *
 * 3. HYBRID REFACTOR WARNING:
 * - `hasPermission` lấy dữ liệu từ `AuthProvider`. Nếu user đăng nhập ở client, context này cần được cập nhật để hiển thị đúng các link quyền hạn.
 * =====================================================================
 */

interface HeaderNavProps {
  initialUser?: any;
  permissions?: string[];
}

import { useTranslations } from "next-intl";

export function HeaderNav({
  initialUser,
  permissions: propsPermissions,
}: HeaderNavProps) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  // Use initialUser directly from props (already fetched by layout)
  const user = initialUser;
  const { hasPermission: contextHasPermission } = useAuth();

  // Use permissions from props if available (for PPR stability), otherwise fallback to context
  const hasPermission = (perm: string) => {
    if (propsPermissions) return propsPermissions.includes(perm);
    return contextHasPermission(perm);
  };

  const links = [
    { href: "/", label: t("home"), icon: Home, exact: true },
    { href: "/shop", label: t("shop"), icon: ShoppingBag, exact: false },
    { href: "/about", label: t("about"), icon: Info, exact: true },
    { href: "/blog", label: t("journal"), icon: BookOpen, exact: false },
    { href: "/contact", label: t("contact"), icon: Phone, exact: true },
  ];

  return (
    <nav className="hidden md:flex items-center gap-6 text-base font-medium">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href as any}
          className={cn(
            "transition-colors flex items-center gap-1 relative w-fit after:absolute after:bottom-[-2px] after:left-0 after:h-[2px] after:bg-primary after:transition-all after:duration-300",
            (
              link.exact
                ? pathname === link.href
                : pathname.startsWith(link.href)
            )
              ? "text-primary font-semibold after:w-full"
              : "text-foreground/60 hover:text-foreground/80 after:w-0 hover:after:w-full"
          )}
        >
          <span className="flex items-center gap-1">
            <link.icon size={16} /> {link.label}
          </span>
        </Link>
      ))}

      {hasPermission("admin:read") && (
        <Link
          href={"/admin" as any}
          className={cn(
            "transition-colors flex items-center gap-1 font-semibold relative w-fit after:absolute after:bottom-[-2px] after:left-0 after:h-[2px] after:bg-primary after:transition-all after:duration-300",
            pathname?.startsWith("/admin")
              ? "after:w-full"
              : "hover:text-foreground/80 after:w-0 hover:after:w-full"
          )}
        >
          <span className="flex items-center gap-1">
            <ShieldCheck size={16} /> {t("admin")}
          </span>
        </Link>
      )}
    </nav>
  );
}
