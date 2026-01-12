"use client";

/**
 * =====================================================================
 * FEATURED BRANDS - Section thương hiệu nổi bật
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. DATA FETCHING PATTERN:
 * - Component nhận `brandsPromise` thay vì data trực tiếp.
 * - Sử dụng `use(brandsPromise)` để suspend component cho đến khi data sẵn sàng.
 * - Pattern này cho phép Streaming SSR: Các phần khác của trang load trước, phần này load sau.
 *
 * 2. ANIMATION STAGGER:
 * - `staggerChildren: 0.1`: Các phần tử con sẽ xuất hiện lần lượt cách nhau 0.1s.
 * - Tạo hiệu ứng domino mượt mà thay vì hiện tất cả cùng lúc.
 * =====================================================================
 */
import { BrandCard } from "@/features/brands/components/brand-card";
import { Link } from "@/i18n/routing";
import { fadeInUp, itemScaleVariant, staggerContainer } from "@/lib/animations";
import { cn } from "@/lib/utils";
import { Brand } from "@/types/models";
import { m } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";

interface FeaturedBrandsProps {
  brands: Brand[];
  title?: string;
  subtitle?: string;
  opacity?: number;
  grayscale?: boolean;
  layout?: "grid" | "carousel";
  logoSize?: "sm" | "md" | "lg";
  hoverEffect?: "scale" | "lift" | "glow";
  alignment?: "left" | "center";
}

export function FeaturedBrands({
  brands,
  title,
  subtitle,
  opacity = 1,
  grayscale = false,
  layout = "grid",
  logoSize = "md",
  hoverEffect = "lift",
  alignment = "left",
}: FeaturedBrandsProps) {
  const t = useTranslations("home");

  const logoSizeClasses = {
    sm: "h-12 md:h-16",
    md: "h-16 md:h-24",
    lg: "h-20 md:h-32",
  };

  return (
    <section className="w-full">
      <m.div
        className={cn(
          "flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12",
          alignment === "center" && "items-center text-center flex-col",
          alignment === "left" && "items-start text-left"
        )}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeInUp}
      >
        <div className="space-y-3">
          <span className="text-accent font-bold uppercase tracking-[0.3em] text-[10px] block">
            {t("featuredBrands")}
          </span>
          <h2 className="text-4xl md:text-6xl font-serif tracking-tight text-foreground leading-tight">
            {title || t("ourPartners")}
          </h2>
          {subtitle && (
            <p className="text-muted-foreground text-sm max-w-lg font-light leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>

        <div
          className={cn(
            "flex",
            alignment === "center" ? "justify-center" : "justify-end"
          )}
        >
          <Link
            href="/brands"
            className="group text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground hover:text-accent transition-all flex items-center gap-3"
          >
            <span className="relative">
              {t("viewAllBrands")}
              <span className="absolute -bottom-1 left-0 w-0 h-px bg-accent transition-all duration-300 group-hover:w-full" />
            </span>
            <ArrowRight
              size={12}
              className="group-hover:translate-x-1.5 transition-transform"
            />
          </Link>
        </div>
      </m.div>

      <m.div
        className={cn(
          "grid grid-cols-2 md:grid-cols-4 gap-8 items-center justify-items-center",
          grayscale &&
            "grayscale hover:grayscale-0 transition-all duration-700",
          layout === "grid" ? "grid" : "flex flex-wrap"
        )}
        style={{ opacity }}
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
      >
        {brands.slice(0, 8).map((brand) => (
          <m.div
            key={brand.id}
            variants={itemScaleVariant}
            whileHover={
              hoverEffect === "lift"
                ? {
                    y: -10,
                    scale: 1.05,
                    transition: { type: "spring", stiffness: 400, damping: 15, mass: 0.5 },
                  }
                : hoverEffect === "glow"
                ? {
                    filter:
                      "brightness(1.2) drop-shadow(0 0 15px rgba(var(--accent), 0.3))",
                  }
                : { scale: 1.1 }
            } 
            className={cn(
              "relative w-full flex items-center justify-center p-6 grayscale-0 contrast-125 transition-[filter] duration-300",
              logoSizeClasses[logoSize]
            )}
          >
            <BrandCard
              id={brand.id}
              name={brand.name}
              count={brand._count?.products || 0}
              imageUrl={brand.imageUrl || undefined}
              className="border border-border/40 bg-card/50 shadow-sm p-0 group rounded-2xl overflow-hidden"
            />
          </m.div>
        ))}
      </m.div>
    </section>
  );
}
