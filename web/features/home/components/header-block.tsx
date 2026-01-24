"use client";

import { StickyHeader } from "@/components/shared/sticky-header";
import { Logo } from "@/features/layout/components/logo";
import { Link, usePathname } from "@/i18n/routing";
import { TypedLink, AppRoute } from "@/lib/typed-navigation";
import { cn } from "@/lib/utils";
import { FlexibleIcon } from "@/components/shared/flexible-icon";
import { Menu } from "lucide-react"; // Keeping Menu as it's used later

interface HeaderLink {
  label: string;
  href: string;
  icon?: string; // Lucide name or Image URL
}

interface HeaderUtil {
  icon: string;
  label: string;
  href: string;
}

interface HeaderStyles {
  textColor?: string;
  backgroundColor?: string;
  transparent?: boolean;
}

interface HeaderBlockProps {
  links?: HeaderLink[];
  styles?: HeaderStyles;
  transparent?: boolean; // Legacy
  logoText?: string;
  height?: string; // Legacy tailwind class
  customHeight?: number; // Numeric height in px
  alignment?: "left" | "center" | "right";
  utils?: HeaderUtil[];
  showSearch?: boolean; // Legacy fallback
  showCart?: boolean; // Legacy fallback
  showUser?: boolean; // Legacy fallback
  fullWidth?: boolean;
}


export function HeaderBlock({
  links,
  styles,
  transparent,
  height = "h-20",
  customHeight,
  alignment = "right",
  showSearch = true,
  showCart = true,
  showUser = true,
  utils,
  fullWidth = false,
}: HeaderBlockProps) {
  const pathname = usePathname();

  // Normalize props
  const isTransparent =
    styles?.transparent !== undefined ? styles.transparent : transparent;
  const textColor = styles?.textColor;
  const bgColor = styles?.backgroundColor;

  const navLinks = links || [
    { label: "Home", href: "/" },
    { label: "Shop", href: "/shop" },
    { label: "About", href: "/about" },
    { label: "Contact", href: "/contact" },
  ];

  // Default utils if none provided
  const headerUtils = utils || [
    ...(showSearch
      ? [{ icon: "Search", label: "Search", href: "/search" }]
      : []),
    ...(showCart
      ? [{ icon: "ShoppingCart", label: "Cart", href: "/cart" }]
      : []),
    ...(showUser ? [{ icon: "User", label: "Account", href: "/admin" }] : []),
  ];

  return (
    <StickyHeader
      isInline={false}
      className={cn(
        "z-100 transition-all duration-500",
        isTransparent
          ? "bg-transparent border-transparent"
          : "border-b backdrop-blur-xl shadow-sm"
      )}
    >
      <div
        className={cn(
          "container flex items-center justify-between mx-auto px-4 md:px-8",
          !customHeight && height,
          fullWidth ? "max-w-full" : "max-w-7xl"
        )}
        style={{
          ...(customHeight ? { height: `${customHeight}px` } : {}),
          backgroundColor: !isTransparent
            ? bgColor || "rgba(255, 255, 255, 0.8)"
            : undefined,
          color: textColor,
        }}
      >
        <div className="flex-none">
          <Logo />
        </div>

        <nav
          className={cn(
            "hidden md:flex items-center gap-8 flex-1 px-8",
            alignment === "center"
              ? "justify-center"
              : alignment === "right"
              ? "justify-end"
              : "justify-start"
          )}
        >
          {navLinks.map((link) => (
            <TypedLink
              key={link.href}
              href={(link.href || "#") as AppRoute}
              className={cn(
                "flex items-center gap-2 text-[11px] font-bold tracking-[0.2em] uppercase transition-colors relative after:absolute after:bottom-[-4px] after:left-0 after:h-px after:bg-primary after:transition-all after:duration-300",
                pathname === link.href
                  ? "text-primary after:w-full"
                  : "hover:text-primary after:w-0 hover:after:w-full"
              )}
              style={{
                color:
                  pathname !== link.href && textColor ? textColor : undefined,
              }}
            >
              <FlexibleIcon source={link.icon} size={14} />
              {link.label}
            </TypedLink>
          ))}
        </nav>

        <div className="flex items-center gap-2 md:gap-4 flex-none">
          {headerUtils.map((util, idx) => (
            <TypedLink
              key={idx}
              href={(util.href || "#") as AppRoute}
              title={util.label}
              className="p-2 hover:bg-accent/10 rounded-full transition-colors relative block"
            >
              <FlexibleIcon
                source={util.icon}
                className={!!textColor ? "" : "text-foreground/70"}
              />
            </TypedLink>
          ))}
          <button className="md:hidden p-2 hover:bg-accent/10 rounded-full transition-colors">
            <Menu size={20} className={!!textColor ? "" : "text-foreground"} />
          </button>
        </div>
      </div>
    </StickyHeader>
  );
}
