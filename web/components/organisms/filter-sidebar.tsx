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
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. URL-BASED STATE (Trạng thái dựa trên URL):
 * - Thay vì dùng `useState` để lưu filter đang chọn -> Ta lưu lên URL (`?categoryId=...`).
 * - Lợi ích: User f5 không mất filter, có thể share link cho người khác đúng filter đó.
 *
 * 2. ROUTER PREFETCHING (Kỹ thuật tăng tốc):
 * - Logic `onMouseEnter`: Khi user chỉ mới VỪA RÊ CHUỘT vào nút lọc -> Ta đã gọi `router.prefetch()`.
 * - Next.js sẽ tải ngầm trang kết quả ở background.
 * - Khi user thực sự Click -> Trang mới hiện ra TỨC THÌ (Instant Navigation).
 *
 * 3. PERFORMANCE (`React.memo`):
 * - Sidebar này nhận list category/brand ít thay đổi.
 * - Dùng `memo` để nó không bị render lại vô nghĩa khi Parent Component (ProductList) re-render do data thay đổi.
 * =====================================================================
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

  // State quản lý việc đóng mở danh sách dài ("Show More")
  const [showAllCategories, setShowAllCategories] = useState(false);
  const [showAllBrands, setShowAllBrands] = useState(false);

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

    // Style riêng cho Brand (Màu Amber) và Category (Màu Primary)
    const activeClass = isBrand
      ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 shadow-lg shadow-amber-500/5"
      : "bg-primary/10 text-primary border border-primary/20 shadow-lg shadow-primary/5";

    return (
      <button
        key={id || "all"}
        onClick={() => handleFilter(type, id)}
        // PREFETCHING STRATEGY:
        onMouseEnter={() => {
          if (!isActive && !isPending) {
            // Giả lập URL mới
            const params = new URLSearchParams(searchParams.toString());
            if (id === null) params.delete(type);
            else params.set(type, id);

            // Tải trước dữ liệu
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
      {/* 1. Header Sidebar */}
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

          {/* Phần mở rộng có animation */}
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

          {/* Nút Show More/Less chỉ hiện khi có > 6 categories */}
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
