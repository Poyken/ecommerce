"use client";

import { GlassButton } from "@/components/shared/glass-button";
import { usePathname, useRouter } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { Brand, Category } from "@/types/models";
import { m } from "@/lib/animations";
import { AnimatePresence } from "framer-motion";
import { ChevronDown, ChevronUp, Filter, Loader2, Tag } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { memo, useCallback, useState } from "react";



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

  // State quản lý việc đóng mở danh sách dài ("Show More")
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [showAllBrands, setShowAllBrands] = useState(false);

  const safeCategories = Array.isArray(categories) ? categories : [];
  const safeBrands = Array.isArray(brands) ? brands : [];

  // useCallback để function reference không đổi qua các lần render -> Props cho Child không đổi -> memo hoạt động hiệu quả
  const handleFilter = useCallback(
    (type: "categoryId" | "brandId", value: string | null) => {
      onFilterChange(type, value);
    },
    [onFilterChange]
  );

  // Lấy state hiện tại từ URL
  const currentCategory = searchParams.get("categoryId");
  const currentBrand = searchParams.get("brandId");
  const hasActiveFilters = currentCategory || currentBrand;

  /**
   * Helper function render từng nút lọc
   * Giúp code DRY (Don't Repeat Yourself)
   */
  const renderFilterButton = (
    id: string | null,
    name: string,
    activeId: string | null,
    type: "categoryId" | "brandId",
    isBrand = false
  ) => {
    // Logic xác định nút này có đang active không
    // Nếu id=null (nút "Tất cả") -> Active khi activeId cũng null
    // Nếu id != null -> Active khi activeId match id
    const isActive = id === null ? !activeId : activeId === id;

    // Standard Luxury style for both
    const activeClass = "bg-primary/20 text-primary border border-primary/30 shadow-2xl shadow-primary/10 scale-[1.02]";

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
          "block w-full text-left text-[10px] px-4 py-3 rounded-xl transition-all duration-500 font-black uppercase tracking-[0.1em] transform-gpu will-change-[transform,background-color,border-color]",
          isActive
            ? activeClass
            : "text-muted-foreground/40 hover:text-white hover:bg-white/5 hover:translate-x-1 border border-transparent"
        )}
      >
        {name}
      </button>
    );
  };

  return (
    <aside className={cn("space-y-6", className)}>
      {/* 1. Header Sidebar */}
      {!hideTitle && (
        <div className="flex items-center justify-between pb-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
              <Filter className="w-4 h-4 text-primary" />
            </div>
            <h2 className="font-black text-xs uppercase tracking-[0.2em] text-white">
              {t("filters")}
            </h2>
          </div>
        </div>
      )}

      {/* 2. Categories Section */}
      <div className="space-y-4">
        <h3 className="font-black text-[11px] tracking-[0.2em] text-primary uppercase flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
          {t("categories")}
        </h3>
        <div className="space-y-2">
          {/* Nút "Tất cả" */}
          {renderFilterButton(
            null,
            t("allCategories"),
            currentCategory,
            "categoryId"
          )}

          {/* Top 6 categories */}
          {safeCategories
            .slice(0, 6)
            .map((cat) =>
              renderFilterButton(
                cat.id,
                cat.name,
                currentCategory,
                "categoryId"
              )
            )}

          {/* Phần mở rộng có animation */}
          <AnimatePresence>
            {showAllCategories && (
              <m.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-hidden space-y-2"
              >
                {safeCategories
                  .slice(6)
                  .map((cat) =>
                    renderFilterButton(
                      cat.id,
                      cat.name,
                      currentCategory,
                      "categoryId"
                    )
                  )}
              </m.div>
            )}
          </AnimatePresence>

          {/* Nút Show More/Less chỉ hiện khi có > 6 categories */}
          {safeCategories.length > 6 && (
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

      {/* 3. Brands Section (Tương tự Categories) */}
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

          {safeBrands
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
              <m.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-hidden space-y-2"
              >
                {safeBrands
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
              </m.div>
            )}
          </AnimatePresence>

          {safeBrands.length > 6 && (
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

      {/* 4. Reset All Button */}
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
