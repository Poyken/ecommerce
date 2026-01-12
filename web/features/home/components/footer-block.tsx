"use client";

import { Logo } from "@/features/layout/components/logo";
import { Link } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import {
  Facebook,
  Instagram,
  MapPin,
  Phone,
  Twitter,
  Youtube,
} from "lucide-react";

interface SocialLink {
  platform: string;
  url: string;
}

interface FooterColumn {
  title: string;
  links: { label: string; href: string }[];
}

interface FooterStyles {
  backgroundColor?: string;
  textColor?: string;
}

interface FooterBlockProps {
  companyName?: string;
  description?: string;
  socialLinks?: SocialLink[];
  theme?: "dark" | "minimal" | "brushed";
  columns?: FooterColumn[];
  showContact?: boolean;
  styles?: FooterStyles;
}

/**
 * =================================================================================================
 * FOOTER BLOCK - CHÂN TRANG (GLOBAL FOOTER)
 * =================================================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. COMPLEX CONFIGURATION:
 *    - Footer là block phức tạp nhất với nhiều cột (Columns), Social Links, và Theme options.
 *    - `theme` prop: Cho phép switch nhanh giữa giao diện Tối (Dark), Tối giản (Minimal), v.v.
 *
 * 2. CONDITIONAL STYLING:
 *    - Sử dụng `cn()` (clsx + tailwind-merge) để xử lý logic class phức tạp.
 *    - Ưu tiên `styles.backgroundColor` (User custom) > `theme` (Preset). *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Component giao diện (UI) tái sử dụng, đảm bảo tính nhất quán về thiết kế (Design System).

 * =================================================================================================
 */
export function FooterBlock({
  companyName,
  description,
  socialLinks,
  theme = "dark",
  columns,
  showContact = true,
  styles,
}: FooterBlockProps) {
  const socials = socialLinks || [
    { platform: "Instagram", url: "#" },
    { platform: "Facebook", url: "#" },
    { platform: "Twitter", url: "#" },
  ];

  const defaultColumns = [
    {
      title: "Collections",
      links: [
        { label: "Living Room", href: "/shop" },
        { label: "Dining Room", href: "/shop" },
        { label: "Bedroom", href: "/shop" },
      ],
    },
    {
      title: "Company",
      links: [
        { label: "Our Story", href: "/about" },
        { label: "Careers", href: "#" },
        { label: "Contact", href: "/contact" },
      ],
    },
  ];

  const displayColumns = columns || defaultColumns;

  const getIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case "instagram":
        return Instagram;
      case "facebook":
        return Facebook;
      case "twitter":
        return Twitter;
      case "youtube":
        return Youtube;
      default:
        return Instagram;
    }
  };

  // Determine styles based on theme or custom override
  // Determine styles based on theme or custom override

  return (
    <footer
      className={cn(
        "relative pt-24 pb-12 overflow-hidden w-full transition-colors duration-500",
        !styles?.backgroundColor &&
          (theme === "minimal"
            ? "bg-background text-foreground border-t"
            : theme === "brushed"
            ? "bg-zinc-100 text-zinc-900"
            : "bg-[#0A0A0A] text-white")
      )}
      style={{
        backgroundColor: styles?.backgroundColor,
        color: styles?.textColor,
      }}
    >
      {theme !== "minimal" && !styles?.backgroundColor && (
        <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      )}

      <div className="container mx-auto px-4 md:px-8 relative z-10 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-20">
          <div className="space-y-6">
            <Logo />
            <p
              className={cn(
                "text-sm leading-relaxed max-w-xs font-light",
                styles?.textColor
                  ? ""
                  : theme === "minimal"
                  ? "text-muted-foreground"
                  : "text-white/50"
              )}
              style={{
                color: styles?.textColor ? `${styles.textColor}99` : undefined,
              }}
            >
              {description ||
                "Defining the future of luxury living with curated furniture and decor for the modern home."}
            </p>
            <div className="flex gap-4">
              {socials.map((social, i) => {
                const Icon = getIcon(social.platform);
                return (
                  <Link
                    key={i}
                    href={social.url as any}
                    className={cn(
                      "w-10 h-10 rounded-full border flex items-center justify-center transition-all duration-300",
                      styles?.textColor
                        ? "border-current hover:bg-current/10"
                        : theme === "minimal"
                        ? "border-zinc-200 bg-zinc-50 text-zinc-600 hover:text-primary hover:border-primary"
                        : "border-white/10 bg-white/5 text-white/60 hover:text-white hover:border-primary/50 hover:bg-primary/10"
                    )}
                  >
                    <Icon size={18} />
                  </Link>
                );
              })}
            </div>
          </div>

          {displayColumns.map((col, idx) => (
            <div key={idx} className="space-y-6">
              <h4
                className={cn(
                  "text-xs font-black uppercase tracking-widest",
                  styles?.textColor
                    ? ""
                    : theme === "minimal"
                    ? "text-foreground"
                    : "text-white"
                )}
              >
                {col.title}
              </h4>
              <ul className="space-y-4">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href as any}
                      className={cn(
                        "transition-colors text-sm",
                        styles?.textColor
                          ? "hover:underline"
                          : theme === "minimal"
                          ? "text-muted-foreground hover:text-primary"
                          : "text-white/40 hover:text-primary"
                      )}
                      style={{
                        color: styles?.textColor
                          ? `${styles.textColor}99`
                          : undefined,
                      }}
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {showContact && (
            <div className="space-y-6">
              <h4
                className={cn(
                  "text-xs font-black uppercase tracking-widest",
                  styles?.textColor
                    ? ""
                    : theme === "minimal"
                    ? "text-foreground"
                    : "text-white"
                )}
              >
                Contact
              </h4>
              <ul className="space-y-4">
                <li
                  className={cn(
                    "flex items-start gap-3 text-sm italic",
                    styles?.textColor
                      ? ""
                      : theme === "minimal"
                      ? "text-muted-foreground"
                      : "text-white/40"
                  )}
                  style={{
                    color: styles?.textColor
                      ? `${styles.textColor}99`
                      : undefined,
                  }}
                >
                  <MapPin size={16} className="mt-1 text-primary shrink-0" />
                  <span>
                    123 Luxury Avenue, Design District,
                    <br />
                    New York, NY 10001
                  </span>
                </li>
                <li
                  className={cn(
                    "flex items-center gap-3 text-sm",
                    styles?.textColor
                      ? ""
                      : theme === "minimal"
                      ? "text-muted-foreground"
                      : "text-white/40"
                  )}
                  style={{
                    color: styles?.textColor
                      ? `${styles.textColor}99`
                      : undefined,
                  }}
                >
                  <Phone size={16} className="text-primary" />
                  <span>+1 (888) 123-4567</span>
                </li>
              </ul>
            </div>
          )}
        </div>

        <div
          className={cn(
            "pt-8 border-t flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] uppercase tracking-widest font-medium transition-colors",
            styles?.textColor
              ? "border-current/20"
              : theme === "minimal"
              ? "border-zinc-200 text-zinc-400"
              : "border-white/5 text-white/30"
          )}
          style={{
            color: styles?.textColor ? `${styles.textColor}80` : undefined,
          }}
        >
          <p>
            &copy; {new Date().getFullYear()} {companyName || "Luxe Premium"}.
            All Rights Reserved.
          </p>
          <div className="flex gap-6">
            <Link href="#" className="hover:text-primary transition-colors">
              Privacy Policy
            </Link>
            <Link href="#" className="hover:text-primary transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
