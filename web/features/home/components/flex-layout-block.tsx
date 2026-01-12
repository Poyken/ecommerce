/**
 * =====================================================================
 * FLEX LAYOUT BLOCK - CHIA CỘT NỘI DUNG LINH HOẠT
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * Block đa năng nhất trong Page Builder. Cho phép Admin tự chia cột
 * (1, 1-1, 1-2, 2-1...) và đặt nội dung vào từng cột.
 * Phù hợp làm section Features, Giới thiệu hoặc Banner đôi.
 * =====================================================================
 */

"use client";

import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";
import * as LucideIcons from "lucide-react";
import Image from "next/image";
import { Link } from "@/i18n/routing";

interface FlexItem {
  title?: string;
  description?: string;
  image?: string;
  link?: string;
  linkText?: string;
  icon?: string;
  alignment?: "left" | "center" | "right";
  theme?: "light" | "dark" | "glass";
}

interface FlexLayoutBlockProps {
  title?: string;
  subtitle?: string;
  layout?: "1" | "1-1" | "1-2" | "2-1" | "1-1-1" | "1-1-1-1";
  gap?: "none" | "small" | "medium" | "large";
  items?: FlexItem[];
  styles?: {
    backgroundColor?: string;
    textColor?: string;
    paddingTop?: string;
    paddingBottom?: string;
  };
}

export function FlexLayoutBlock({
  title,
  subtitle,
  layout = "1-1",
  gap = "medium",
  items = [],
  styles,
}: FlexLayoutBlockProps) {
  const layoutClasses = {
    "1": "grid-cols-1",
    "1-1": "grid-cols-1 md:grid-cols-2",
    "1-2": "grid-cols-1 md:grid-cols-3", // 1 part, 2 parts
    "2-1": "grid-cols-1 md:grid-cols-3", // 2 parts, 1 part
    "1-1-1": "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    "1-1-1-1": "grid-cols-1 md:grid-cols-2 lg:grid-cols-4",
  };

  const gapClasses = {
    none: "gap-0",
    small: "gap-4",
    medium: "gap-8",
    large: "gap-12",
  };

  const getColSpan = (idx: number) => {
    if (layout === "1-2") return idx === 1 ? "md:col-span-2" : "md:col-span-1";
    if (layout === "2-1") return idx === 0 ? "md:col-span-2" : "md:col-span-1";
    return "col-span-1";
  };

  return (
    <section
      className="w-full py-16 md:py-24"
      style={{
        backgroundColor: styles?.backgroundColor,
        color: styles?.textColor,
        paddingTop: styles?.paddingTop,
        paddingBottom: styles?.paddingBottom,
      }}
    >
      <div className="container mx-auto px-4">
        {(title || subtitle) && (
          <div className="mb-12 text-center max-w-2xl mx-auto">
            {title && (
              <h2 className="text-3xl md:text-5xl font-serif mb-4">{title}</h2>
            )}
            {subtitle && (
              <p className="text-muted-foreground text-lg">{subtitle}</p>
            )}
          </div>
        )}

        <div className={cn("grid", layoutClasses[layout], gapClasses[gap])}>
          {items.map((item, idx) => {
            const Icon = item.icon ? (LucideIcons as any)[item.icon] : null;

            return (
              <div
                key={idx}
                className={cn(
                  "relative group overflow-hidden rounded-3xl transition-all duration-500",
                  getColSpan(idx),
                  item.theme === "dark"
                    ? "bg-black text-white"
                    : item.theme === "glass"
                    ? "glass-luxury border-white/10"
                    : "bg-muted/30"
                )}
              >
                {item.image && (
                  <div className="absolute inset-0 z-0">
                    <Image
                      src={item.image}
                      alt={item.title || "Flex Item"}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-110 opacity-40 group-hover:opacity-60"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />
                  </div>
                )}

                <div
                  className={cn(
                    "relative z-10 p-8 h-full flex flex-col",
                    item.alignment === "center"
                      ? "items-center text-center"
                      : item.alignment === "right"
                      ? "items-end text-right"
                      : "items-start",
                    item.image ? "justify-end min-h-[400px]" : "justify-center"
                  )}
                >
                  {Icon && (
                    <div className="p-3 rounded-2xl bg-primary/10 text-primary mb-6">
                      <Icon size={32} strokeWidth={1.5} />
                    </div>
                  )}
                  {item.title && (
                    <h3 className="text-2xl md:text-3xl font-serif mb-3 tracking-tight">
                      {item.title}
                    </h3>
                  )}
                  {item.description && (
                    <p
                      className={cn(
                        "text-sm md:text-base mb-6 leading-relaxed max-w-sm",
                        item.image || item.theme === "dark"
                          ? "text-white/70"
                          : "text-muted-foreground"
                      )}
                    >
                      {item.description}
                    </p>
                  )}
                  {item.link && (
                    <Link
                      href={item.link as any}
                      className="inline-flex items-center gap-2 group/link font-bold text-xs uppercase tracking-widest text-primary hover:text-primary/80 transition-colors"
                    >
                      {item.linkText || "Learn More"}
                      <ArrowRight
                        size={14}
                        className="transition-transform group-hover/link:translate-x-1"
                      />
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
