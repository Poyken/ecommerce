"use client";

import { useAuth } from "@/features/auth/providers/auth-provider";
import { Link, usePathname } from "@/i18n/routing";
import { TypedLink, appRoutes } from "@/lib/typed-navigation";
import { cn } from "@/lib/utils";
import {
  BookOpen,
  Home,
  Info,
  Phone,
  ShieldCheck,
  ShoppingBag,
} from "lucide-react";



import { User } from "@/types/models";

interface HeaderNavProps {
  initialUser?: User | null;
  permissions?: string[];
}

import { useTranslations } from "next-intl";

export function HeaderNav({ permissions: propsPermissions }: HeaderNavProps) {
  const t = useTranslations("nav");
  const pathname = usePathname();

  const { hasPermission: contextHasPermission } = useAuth();

  // Use permissions from props if available (for PPR stability), otherwise fallback to context
  const hasPermission = (perm: string) => {
    if (propsPermissions) return propsPermissions.includes(perm);
    return contextHasPermission(perm);
  };

  const links = [
    { href: appRoutes.home, label: t("home"), icon: Home, exact: true },
    { href: appRoutes.shop, label: t("shop"), icon: ShoppingBag, exact: false },
    { href: appRoutes.about, label: t("about"), icon: Info, exact: true },
    { href: appRoutes.blog, label: t("journal"), icon: BookOpen, exact: false },
    { href: appRoutes.contact, label: t("contact"), icon: Phone, exact: true },
  ];

  return (
    <nav className="hidden md:flex items-center gap-6 text-base font-medium">
      {links.map((link) => (
        <TypedLink
          key={link.href}
          href={link.href}
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
        </TypedLink>
      ))}

      {hasPermission("superAdmin:read") && (
        <TypedLink
          href={appRoutes.admin.superAdmin}
          className={cn(
            "transition-colors flex items-center gap-1 font-semibold relative w-fit after:absolute after:bottom-[-2px] after:left-0 after:h-[2px] after:bg-primary after:transition-all after:duration-300",
            pathname?.startsWith("/super-admin")
              ? "after:w-full"
              : "hover:text-foreground/80 after:w-0 hover:after:w-full shadow-sm shadow-primary/20 bg-primary/5 px-3 py-1 rounded-full border border-primary/10"
          )}
        >
          <span className="flex items-center gap-1.5 text-primary">
            <ShieldCheck size={16} /> {t("superAdmin")}
          </span>
        </TypedLink>
      )}

      {hasPermission("admin:read") && !hasPermission("superAdmin:read") && (
        <TypedLink
          href={appRoutes.admin.dashboard}
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
        </TypedLink>
      )}
    </nav>
  );
}
