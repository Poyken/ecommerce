"use client";

import { CompactRating } from "@/features/reviews/components/review-preview";
import { OptimizedImage } from "@/components/shared/optimized-image";
import { Link } from "@/i18n/routing";
import { m } from "@/lib/animations";
import { cn, formatCurrency } from "@/lib/utils";
import { useTypedRouter, appRoutes } from "@/lib/typed-navigation";
import { useTranslations } from "next-intl";
import { ReactNode, useCallback } from "react";

export interface ProductCardBaseProps {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  imageUrl: string;
  category?: string;
  rating?: number;
  reviewCount?: number;

  // State flags
  isNew?: boolean;
  isHot?: boolean;
  isSale?: boolean;
  isLowStock?: boolean;
  isCompact?: boolean;

  // Actions (Slots for flexibility)
  actions?: {
    wishlist?: ReactNode;
    quickView?: ReactNode;
    addToCart?: ReactNode;
    overlay?: ReactNode;
  };

  variant?: "default" | "luxury" | "glass";
  className?: string;
  onMouseEnter?: () => void;
}

/**
 * =====================================================================
 * PRODUCT CARD BASE - Card sản phẩm dùng chung
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. PREDICTIVE PREFETCHING:
 * - `onMouseEnter`: Khi user hover vào card, ta đoán 80% user sẽ click.
 * - Gọi `router.prefetch()` để tải trước trang chi tiết. Khi click sẽ chuyển trang NGAY LẬP TỨC.
 *
 * 2. SLOT PATTERN (Render Props):
 * - Prop `actions` nhận vào ReactNode (nút Wishlist, QuickView...).
 * - Giúp Card này tái sử dụng được ở nhiều nơi với các nút bấm khác nhau mà không cần
 *   hard-code logic cụ thể. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Component giao diện (UI) tái sử dụng, đảm bảo tính nhất quán về thiết kế (Design System).

 * =====================================================================
 */
export function ProductCardBase({
  id,
  name,
  price,
  originalPrice,
  imageUrl,
  category,
  rating,
  reviewCount,
  isNew,
  isHot,
  isSale,
  isLowStock,
  isCompact = false,
  actions,
  variant = "default",
  className,
  onMouseEnter,
}: ProductCardBaseProps) {
  const t = useTranslations("productCard");
  const router = useTypedRouter();

  // [P10 OPTIMIZATION] Predictive prefetching on hover
  const handleMouseEnter = useCallback(() => {
    router.prefetch(appRoutes.product(id));
    if (onMouseEnter) onMouseEnter();
  }, [id, router, onMouseEnter]);

  // Discount calculation moved to pure logic or passed in,
  // but simple calculation here is fine for display component.
  const discountPercentage =
    originalPrice && originalPrice > price
      ? Math.round(((originalPrice - price) / originalPrice) * 100)
      : 0;

  return (
    <m.div
      layout="position"
      className={cn(
        "group relative rounded-3xl overflow-hidden transition-all duration-500",
        // Default variant
        variant === "default" && "bg-white dark:bg-card border border-neutral-100 dark:border-white/5 shadow-sm",
        // Luxury variant
        variant === "luxury" && "bg-neutral-900 text-white border border-white/10 shadow-2xl",
        // Glass variant
        variant === "glass" && "glass-premium backdrop-blur-2xl border border-white/20 text-foreground dark:text-white shadow-2xl",
        "hover:shadow-2xl hover:shadow-accent/10",
        variant !== "luxury" && "hover:border-accent/30 dark:hover:border-accent/20",
        className
      )}
      onMouseEnter={handleMouseEnter}
      whileHover={!isCompact ? { y: -12 } : {}}
      transition={{
        type: "spring",
        stiffness: 400,
        damping: 30,
        layout: {
          type: "spring",
          stiffness: 260,
          damping: 35,
        },
      }}
    >
      {/* A. IMAGE CONTAINER */}
      <div className="relative aspect-4/5 overflow-hidden bg-neutral-50 dark:bg-neutral-900">
        <Link href={`/products/${id}`} className="relative block w-full h-full">
          <OptimizedImage
            src={imageUrl || "/images/placeholders/product-placeholder.jpg"}
            alt={name}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            containerClassName="w-full h-full"
            className="object-cover transition-transform duration-1000 ease-[0.16,1,0.3,1] group-hover:scale-110"
            showShimmer={true}
          />
        </Link>

        {/* Overlay Gradient */}
        <div className="absolute inset-0 bg-linear-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

        {/* B. BADGES */}
        <div
          className={cn(
            "absolute top-4 left-4 flex flex-col items-start gap-2 z-10",
            isCompact && "top-3 left-3"
          )}
        >
          {isNew && (
            <span
              key="badge-new"
              className="w-fit bg-accent/90 text-accent-foreground text-[10px] font-black px-3 py-1.5 uppercase tracking-[0.15em] backdrop-blur-md rounded-full shadow-lg"
            >
              {t("new")}
            </span>
          )}

          {isLowStock && (
            <m.span
              key="badge-low-stock"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-fit bg-orange-500/90 text-white text-[10px] font-black px-3 py-1.5 uppercase tracking-[0.15em] backdrop-blur-md rounded-full shadow-lg animate-pulse"
            >
              {t("lowStock") || "Low Stock"}
            </m.span>
          )}

          {!isNew && isHot && (
            <span
              key="badge-hot"
              className="w-fit bg-primary/90 text-primary-foreground text-[10px] font-black px-3 py-1.5 uppercase tracking-[0.15em] backdrop-blur-md rounded-full shadow-lg"
            >
              {t("hot")}
            </span>
          )}

          {!isNew && !isHot && isSale && discountPercentage > 0 && (
            <span
              key="badge-sale"
              className="w-fit bg-destructive/90 text-destructive-foreground text-[10px] font-black px-3 py-1.5 uppercase tracking-[0.15em] backdrop-blur-md rounded-full shadow-lg"
            >
              -{discountPercentage}%
            </span>
          )}
        </div>

        {/* C. ACTIONS (SLOTS) */}

        {/* Wishlist Button Slot */}
        {actions?.wishlist && (
          <div
            className={cn(
              "absolute z-20 transition-all duration-500",
              isCompact ? "top-3 right-3" : "top-5 right-5",
              !isCompact &&
                "opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0"
            )}
          >
            {actions.wishlist}
          </div>
        )}

        {/* Quick View Slot */}
        {actions?.quickView && (
          <>
            {!isCompact ? (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] z-20 translate-y-2 group-hover:translate-y-0 text-center transform-gpu">
                {actions.quickView}
              </div>
            ) : (
              <div className="absolute inset-x-3 bottom-3 z-20 opacity-0 group-hover:opacity-100 transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] translate-y-2 group-hover:translate-y-0 transform-gpu">
                {actions.quickView}
              </div>
            )}
          </>
        )}

        {/* Extra Overlay Actions (e.g. Add to Cart direct) */}
        {actions?.overlay}
      </div>

      {/* E. INFO SECTION */}
      <div className={cn("p-6 space-y-3", isCompact && "p-4 space-y-1")}>
        <div className="flex justify-between items-start gap-4">
          <div className="flex-1 min-w-0">
            {category && !isCompact && (
              <p className="text-[10px] text-accent font-black uppercase tracking-[0.2em] mb-1">
                {category}
              </p>
            )}

            <Link href={`/products/${id}`} className="block">
              <h3
                className={cn(
                  "font-sans font-bold leading-tight truncate group-hover:text-primary transition-colors duration-300",
                  isCompact ? "text-sm" : "text-lg",
                  variant === "luxury" && "text-white"
                )}
              >
                {name}
              </h3>
            </Link>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "font-black tracking-tight",
                isCompact ? "text-base" : "text-xl"
              )}
            >
              {formatCurrency(price)}
            </span>

            {originalPrice !== undefined && originalPrice > price && (
              <span
                className={cn(
                  "text-muted-foreground line-through opacity-50",
                  isCompact ? "text-[10px]" : "text-sm"
                )}
              >
                {formatCurrency(originalPrice)}
              </span>
            )}
          </div>

          {rating !== undefined &&
            reviewCount !== undefined &&
            reviewCount > 0 && (
              <CompactRating
                rating={rating}
                reviewCount={reviewCount}
                className={cn(isCompact ? "scale-90 origin-right" : "")}
              />
            )}
        </div>

        {/* Additional Actions (below price) */}
        {actions?.addToCart && <div className="pt-2">{actions.addToCart}</div>}
      </div>
    </m.div>
  );
}
