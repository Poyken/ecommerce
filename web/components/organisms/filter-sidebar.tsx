"use client";

import { GlassButton } from "@/components/atoms/glass-button";
import { cn } from "@/lib/utils";
import { Brand, Category } from "@/types/models";
import { Filter, Loader2, Tag } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { memo, useCallback } from "react";

/**
 * =====================================================================
 * FILTER SIDEBAR - Thanh lọc sản phẩm (Category, Brand)
 * =====================================================================
 *
 * PERFORMANCE:
 * - React.memo để prevent re-render khi props không thay đổi
 * - useCallback cho handleFilter
 */

interface FilterSidebarProps {
  categories: Category[];
  brands: Brand[];
  className?: string;
  hideTitle?: boolean;
  onFilterChange: (
    type: "categoryId" | "brandId",
    value: string | null
  ) => void;
  isPending?: boolean;
  onClearAll?: () => void;
}

export const FilterSidebar = memo(function FilterSidebar({
  categories,
  brands,
  className,
  hideTitle,
  onFilterChange,
  isPending,
  onClearAll,
}: FilterSidebarProps) {
  const t = useTranslations("common");
  const searchParams = useSearchParams();

  const handleFilter = useCallback(
    (type: "categoryId" | "brandId", value: string | null) => {
      onFilterChange(type, value);
    },
    [onFilterChange]
  );

  const currentCategory = searchParams.get("categoryId");
  const currentBrand = searchParams.get("brandId");
  const hasActiveFilters = currentCategory || currentBrand;

  return (
    <aside className={cn("space-y-6", className)}>
      {/* Filter Header */}
      {!hideTitle && (
        <div className="flex items-center justify-between pb-6 border-b border-foreground/5">
          <div className="flex items-center gap-3">
            <Filter className="w-5 h-5 text-primary" />
            <h2 className="font-black text-lg uppercase tracking-wider">
              {t("filters")}
            </h2>
          </div>
          {isPending && (
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          )}
        </div>
      )}

      {/* Categories Section */}
      <div className="space-y-4">
        <h3 className="font-black text-[11px] tracking-[0.2em] text-primary uppercase flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
          {t("categories")}
        </h3>
        <div className="space-y-2">
          <button
            onClick={() => handleFilter("categoryId", null)}
            disabled={isPending}
            className={cn(
              "block w-full text-left text-sm px-4 py-3 rounded-xl transition-all duration-300 font-bold",
              !currentCategory
                ? "bg-primary/10 text-primary border border-primary/20 shadow-lg shadow-primary/5"
                : "text-muted-foreground/60 hover:text-foreground hover:bg-foreground/2 hover:translate-x-1"
            )}
          >
            {t("allCategories")}
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleFilter("categoryId", cat.id)}
              disabled={isPending}
              className={cn(
                "block w-full text-left text-sm px-4 py-3 rounded-xl transition-all duration-300 font-bold",
                currentCategory === cat.id
                  ? "bg-primary/10 text-primary border border-primary/20 shadow-lg shadow-primary/5"
                  : "text-muted-foreground/60 hover:text-foreground hover:bg-foreground/2 hover:translate-x-1"
              )}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Brands Section */}
      <div className="space-y-4">
        <h3 className="font-black text-[11px] tracking-[0.2em] text-amber-600 dark:text-amber-400 uppercase flex items-center gap-2">
          <Tag className="w-3.5 h-3.5" />
          {t("brands")}
        </h3>
        <div className="space-y-2">
          <button
            onClick={() => handleFilter("brandId", null)}
            disabled={isPending}
            className={cn(
              "block w-full text-left text-sm px-4 py-3 rounded-xl transition-all duration-300 font-bold",
              !currentBrand
                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shadow-lg shadow-amber-500/5"
                : "text-muted-foreground/60 hover:text-foreground hover:bg-foreground/2 hover:translate-x-1"
            )}
          >
            {t("allBrands")}
          </button>
          {brands.map((brand) => (
            <button
              key={brand.id}
              onClick={() => handleFilter("brandId", brand.id)}
              disabled={isPending}
              className={cn(
                "block w-full text-left text-sm px-4 py-3 rounded-xl transition-all duration-300 font-bold",
                currentBrand === brand.id
                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shadow-lg shadow-amber-500/5"
                  : "text-muted-foreground/60 hover:text-foreground hover:bg-foreground/2 hover:translate-x-1"
              )}
            >
              {brand.name}
            </button>
          ))}
        </div>
      </div>

      {/* Reset All */}
      {hasActiveFilters && (
        <GlassButton
          variant="ghost"
          className="w-full text-xs font-black uppercase tracking-widest border-2 border-destructive/20 text-destructive hover:bg-destructive/5 hover:border-destructive/40 transition-all duration-300 mt-6 rounded-xl py-3"
          onClick={onClearAll}
          disabled={isPending}
        >
          {t("resetAllFilters")}
        </GlassButton>
      )}
    </aside>
  );
});
