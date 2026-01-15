"use client";

/**
 * =====================================================================
 * SOCIAL FEED BLOCK - Hiển thị social links hoặc feed
 * =====================================================================
 */

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  Facebook,
  Instagram,
  Linkedin,
  Twitter,
  Youtube,
  ExternalLink,
} from "lucide-react";
import type { BaseBlockProps, SocialLink } from "../types/block-types";

interface SocialFeedBlockProps extends BaseBlockProps {
  title?: string;
  subtitle?: string;
  links?: SocialLink[];
  layout?: "horizontal" | "vertical" | "grid";
  size?: "sm" | "md" | "lg";
  style?: "filled" | "outlined" | "ghost";
  showLabels?: boolean;
  colorful?: boolean;
}

const defaultLinks: SocialLink[] = [
  { platform: "facebook", url: "https://facebook.com/luxesaas" },
  { platform: "instagram", url: "https://instagram.com/luxesaas" },
  { platform: "twitter", url: "https://twitter.com/luxesaas" },
  { platform: "linkedin", url: "https://linkedin.com/company/luxesaas" },
  { platform: "youtube", url: "https://youtube.com/@luxesaas" },
];

const platformInfo: Record<
  SocialLink["platform"],
  { icon: typeof Facebook; label: string; color: string }
> = {
  facebook: { icon: Facebook, label: "Facebook", color: "#1877F2" },
  instagram: { icon: Instagram, label: "Instagram", color: "#E4405F" },
  twitter: { icon: Twitter, label: "Twitter", color: "#1DA1F2" },
  linkedin: { icon: Linkedin, label: "LinkedIn", color: "#0A66C2" },
  youtube: { icon: Youtube, label: "YouTube", color: "#FF0000" },
  tiktok: { icon: ExternalLink, label: "TikTok", color: "#000000" },
  pinterest: { icon: ExternalLink, label: "Pinterest", color: "#E60023" },
};

export function SocialFeedBlock({
  title = "Kết nối với chúng tôi",
  subtitle = "Theo dõi để cập nhật những tin tức và ưu đãi mới nhất",
  links = defaultLinks,
  layout = "horizontal",
  size = "md",
  style = "filled",
  showLabels = false,
  colorful = true,
}: SocialFeedBlockProps) {
  const sizes = {
    sm: {
      button: "size-10",
      icon: "size-4",
      gap: "gap-2",
    },
    md: {
      button: "size-12",
      icon: "size-5",
      gap: "gap-3",
    },
    lg: {
      button: "size-14",
      icon: "size-6",
      gap: "gap-4",
    },
  };

  const getButtonClasses = (platform: SocialLink["platform"]) => {
    const info = platformInfo[platform];
    const base = cn(
      "flex items-center justify-center rounded-xl transition-all duration-300",
      sizes[size].button
    );

    switch (style) {
      case "filled":
        return cn(
          base,
          colorful
            ? "text-white hover:opacity-90 hover:scale-110"
            : "bg-primary text-primary-foreground hover:bg-primary/90"
        );
      case "outlined":
        return cn(
          base,
          "border-2 hover:scale-110",
          colorful
            ? "hover:text-white"
            : "border-border text-muted-foreground hover:border-primary hover:text-primary"
        );
      case "ghost":
        return cn(
          base,
          "hover:scale-110",
          colorful
            ? "hover:opacity-80"
            : "text-muted-foreground hover:text-primary hover:bg-primary/10"
        );
      default:
        return base;
    }
  };

  const getButtonStyle = (platform: SocialLink["platform"]) => {
    if (!colorful) return {};

    const info = platformInfo[platform];

    switch (style) {
      case "filled":
        return { backgroundColor: info.color };
      case "outlined":
        return { borderColor: info.color, color: info.color };
      case "ghost":
        return { color: info.color };
      default:
        return {};
    }
  };

  const renderLink = (link: SocialLink, index: number) => {
    const info = platformInfo[link.platform];
    const Icon = info.icon;

    return (
      <motion.a
        key={link.platform}
        href={link.url}
        target="_blank"
        rel="noopener noreferrer"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: index * 0.1 }}
        className={cn(
          getButtonClasses(link.platform),
          showLabels && "w-auto px-4 gap-2"
        )}
        style={getButtonStyle(link.platform)}
        aria-label={info.label}
      >
        <Icon className={sizes[size].icon} />
        {showLabels && <span className="font-medium">{info.label}</span>}
      </motion.a>
    );
  };

  const layoutClasses = {
    horizontal: cn("flex flex-wrap justify-center", sizes[size].gap),
    vertical: cn("flex flex-col items-center", sizes[size].gap),
    grid: cn(
      "grid grid-cols-3 md:grid-cols-5",
      sizes[size].gap,
      "max-w-md mx-auto"
    ),
  };

  return (
    <section className="py-16 lg:py-24">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Header */}
        {(title || subtitle) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center max-w-3xl mx-auto mb-12"
          >
            {title && (
              <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="text-lg text-muted-foreground">{subtitle}</p>
            )}
          </motion.div>
        )}

        {/* Social Links */}
        <div className={layoutClasses[layout]}>
          {links.map((link, index) => renderLink(link, index))}
        </div>
      </div>
    </section>
  );
}
