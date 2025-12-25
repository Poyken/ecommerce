"use client";

import { GlassButton } from "@/components/atoms/glass-button";
import { usePathname, useRouter } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { Brand, Category } from "@/types/models";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, ChevronUp, Filter, Loader2, Tag } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { memo, useCallback, useState } from "react";

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
  const router = useRouter();
  const pathname = usePathname();
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [showAllBrands, setShowAllBrands] = useState(false);

  const handleFilter = useCallback(
    (type: "categoryId" | "brandId", value: string | null) => {
      onFilterChange(type, value);
    },
    [onFilterChange]
  );

  const currentCategory = searchParams.get("categoryId");
  const currentBrand = searchParams.get("brandId");
  const hasActiveFilters = currentCategory || currentBrand;

  // Helper to render filter button
  const renderFilterButton = (
    id: string | null,
    name: string,
    activeId: string | null,
    type: "categoryId" | "brandId",
    isBrand = false
  ) => {
    const isActive = id === null ? !activeId : activeId === id;
    const activeClass = isBrand
      ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shadow-lg shadow-amber-500/5"
      : "bg-primary/10 text-primary border border-primary/20 shadow-lg shadow-primary/5";

    return (
      <button
        key={id || "all"}
        onClick={() => handleFilter(type, id)}
        onMouseEnter={() => {
          if (!isActive && !isPending) {
            const params = new URLSearchParams(searchParams.toString());
            if (id === null) params.delete(type);
            else params.set(type, id);
            router.prefetch(`${pathname}?${params.toString()}`);
          }
        }}
        disabled={isPending}
        className={cn(
          "block w-full text-left text-sm px-4 py-3 rounded-xl transition-all duration-300 font-bold transform-gpu will-change-[transform,background-color]",
          isActive
            ? activeClass
            : "text-muted-foreground/60 hover:text-foreground hover:bg-foreground/2 hover:translate-x-1"
        )}
      >
        {name}
      </button>
    );
  };

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
          {renderFilterButton(
            null,
            t("allCategories"),
            currentCategory,
            "categoryId"
          )}

          {categories
            .slice(0, 6)
            .map((cat) =>
              renderFilterButton(
                cat.id,
                cat.name,
                currentCategory,
                "categoryId"
              )
            )}

          <AnimatePresence>
            {showAllCategories && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-hidden space-y-2"
              >
                {categories
                  .slice(6)
                  .map((cat) =>
                    renderFilterButton(
                      cat.id,
                      cat.name,
                      currentCategory,
                      "categoryId"
                    )
                  )}
              </motion.div>
            )}
          </AnimatePresence>

          {categories.length > 6 && (
            <button
              onClick={() => setShowAllCategories(!showAllCategories)}
              className="flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-primary transition-colors px-4 py-1"
            >
              {showAllCategories ? (
                <>
                  {t("showLess")} <ChevronUp size={14} />
                </>
              ) : (
                <>
                  {t("showMore")} <ChevronDown size={14} />
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Brands Section */}
      <div className="space-y-4">
        <h3 className="font-black text-[11px] tracking-[0.2em] text-amber-600 dark:text-amber-400 uppercase flex items-center gap-2">
          <Tag className="w-3.5 h-3.5" />
          {t("brands")}
        </h3>
        <div className="space-y-2">
          {renderFilterButton(
            null,
            t("allBrands"),
            currentBrand,
            "brandId",
            true
          )}

          {brands
            .slice(0, 6)
            .map((brand) =>
              renderFilterButton(
                brand.id,
                brand.name,
                currentBrand,
                "brandId",
                true
              )
            )}

          <AnimatePresence>
            {showAllBrands && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-hidden space-y-2"
              >
                {brands
                  .slice(6)
                  .map((brand) =>
                    renderFilterButton(
                      brand.id,
                      brand.name,
                      currentBrand,
                      "brandId",
                      true
                    )
                  )}
              </motion.div>
            )}
          </AnimatePresence>

          {brands.length > 6 && (
            <button
              onClick={() => setShowAllBrands(!showAllBrands)}
              className="flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-amber-600 dark:hover:text-amber-400 transition-colors px-4 py-1"
            >
              {showAllBrands ? (
                <>
                  {t("showLess")} <ChevronUp size={14} />
                </>
              ) : (
                <>
                  {t("showMore")} <ChevronDown size={14} />
                </>
              )}
            </button>
          )}
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
