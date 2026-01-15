"use client";

import { ShopStats } from "@/features/products/components/shop-stats";
import { BreadcrumbNav } from "@/components/shared/breadcrumb-nav";
import { SearchInput } from "@/components/shared/search-input";
import { ProductsSkeleton } from "@/features/home/components/skeletons/home-skeleton";
import { LoadingState } from "@/components/shared/data-states";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { FilterSidebar } from "@/features/products/components/filter-sidebar";
import { ShopGrid } from "@/features/products/components/shop-grid";
import { usePathname, useRouter } from "@/i18n/routing";
import { m } from "@/lib/animations";
import { cn } from "@/lib/utils";
import { Brand, Category, Product } from "@/types/models";
import { AnimatePresence } from "framer-motion";
import { Filter, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import {
  Suspense,
  use,
  useCallback,
  useEffect,
  useState,
  useTransition,
} from "react";

/**
 * =====================================================================
 * SHOP CONTENT - Nội dung trang cửa hàng (Danh sách sản phẩm)
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. FILTER & SORT LOGIC:
 * - Sử dụng `URLSearchParams` để quản lý trạng thái lọc và sắp xếp trực tiếp trên URL.
 * - Giúp người dùng có thể copy link và chia sẻ kết quả tìm kiếm/lọc chính xác.
 * - `useTransition` (`isPending`) được dùng để xử lý chuyển hướng mượt mà không làm treo UI.
 *
 * 2. RESPONSIVE FILTERING:
 * - Trên Desktop: Hiển thị `FilterSidebar` cố định bên trái.
 * - Trên Mobile: Sử dụng `Sheet` (Drawer) để ẩn/hiện bộ lọc, tối ưu không gian hiển thị.
 *
 * 3. DATA STREAMING:
 * - Nhận các `Promise` từ Server Component và sử dụng `Suspense` để hiển thị Skeleton.
 * - `ShopGrid` sẽ unwrap `productsPromise` để hiển thị danh sách sản phẩm. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Component giao diện (UI) tái sử dụng, đảm bảo tính nhất quán về thiết kế (Design System).

 * =====================================================================
 */

interface ShopContentProps {
  productsPromise: Promise<{
    data: Product[];
    meta: { page: number; limit: number; total: number; lastPage: number };
  }>;
  categoriesPromise: Promise<Category[]>;
  brandsPromise: Promise<Brand[]>;
  suggestedProductsPromise: Promise<Product[]>;
  wishlistItems?: Product[];
}

export function ShopContent({
  productsPromise,
  categoriesPromise,
  brandsPromise,
  suggestedProductsPromise,
  wishlistItems = [],
}: ShopContentProps) {
  const t = useTranslations("shop");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isFilterPending, startFilterTransition] = useTransition();

  // Persist columns in URL
  const columnsParam = searchParams.get("columns");
  const initialColumns = (Number(columnsParam) || 4) as 3 | 4 | 5;
  const [columns, setColumnsState] = useState<3 | 4 | 5>(initialColumns);

  // Sync state with URL only when the URL parameter changes (e.g., back/forward)
  useEffect(() => {
    if (columnsParam) {
      const val = Number(columnsParam);
      if (val === 3 || val === 4 || val === 5) {
        if (val !== columns) {
          setColumnsState(val as 3 | 4 | 5);
        }
      }
    }
  }, [columnsParam]); // Removed 'columns' from dependencies

  const setColumns = (newCols: 3 | 4 | 5) => {
    setColumnsState(newCols);
    const params = new URLSearchParams(searchParams.toString());
    params.set("columns", newCols.toString());
    const newUrl = `${pathname}?${params.toString()}`;
    window.history.replaceState(null, "", newUrl);
  };

  // Unwrap categories and brands for sidebar and active filters
  const categories = use(categoriesPromise);
  const brands = use(brandsPromise);

  // Active Filters Logic
  const currentCategory = searchParams.get("categoryId");
  const currentBrand = searchParams.get("brandId");
  const currentSort = searchParams.get("sort") || "newest";

  const activeCategoryName = Array.isArray(categories)
    ? categories.find((c) => c.id === currentCategory)?.name
    : undefined;
  const activeBrandName = Array.isArray(brands)
    ? brands.find((b) => b.id === currentBrand)?.name
    : undefined;
  const hasActiveFilters = !!(
    currentCategory ||
    currentBrand ||
    searchParams.get("search") ||
    searchParams.get("minPrice") ||
    searchParams.get("maxPrice")
  );

  const createQueryString = useCallback(
    (name: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === null) {
        params.delete(name);
      } else {
        params.set(name, value);
      }

      // Reset page to 1 on filter/sort change
      if (name !== "page" && name !== "columns") {
        params.set("page", "1");
      }
      return params.toString();
    },
    [searchParams]
  );

  const handleFilter = useCallback(
    (type: "categoryId" | "brandId", value: string | null) => {
      // Avoid redundant navigation if value hasn't changed
      if (searchParams.get(type) === value) return;

      startFilterTransition(() => {
        const queryString = createQueryString(type, value);
        router.replace(`${pathname}?${queryString}`, { scroll: false });
      });
    },
    [searchParams, createQueryString, router, pathname]
  );

  const handleSortChange = useCallback(
    (value: string) => {
      startFilterTransition(() => {
        router.replace(`${pathname}?${createQueryString("sort", value)}`, {
          scroll: false,
        });
      });
    },
    [createQueryString, router, pathname]
  );

  const handleRemoveFilter = useCallback(
    (key: string) => {
      startFilterTransition(() => {
        router.replace(`${pathname}?${createQueryString(key, null)}`, {
          scroll: false,
        });
      });
    },
    [createQueryString, router, pathname]
  );

  const handleClearAllFilters = useCallback(() => {
    startFilterTransition(() => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("categoryId");
      params.delete("brandId");
      params.delete("search");
      params.delete("minPrice");
      params.delete("maxPrice");
      params.delete("sort");
      params.set("page", "1");

      // Force URL update
      router.replace(`${pathname}?${params.toString()}`, {
        scroll: false,
      });
    });
  }, [searchParams, router, pathname]);

  const isAnyPending = isFilterPending;

  return (
    <div className="min-h-screen bg-background font-sans selection:bg-accent/30">
      <main className="container mx-auto px-4 md:px-8 pt-28 pb-16 space-y-8">
        {/* Breadcrumb Navigation */}
        <BreadcrumbNav items={[{ label: t("title") }]} className="text-sm" />

        <section id="collection" className="space-y-6">
          {/* Header & Controls */}
          <div className="space-y-4 border-b border-foreground/5 pb-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
              <div className="space-y-3">
                <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-accent block">
                  Curated Selection
                </span>
                <h1 className="text-4xl md:text-5xl font-serif font-normal tracking-tight">
                  {t("title")}
                </h1>
                <p className="text-muted-foreground text-base font-light max-w-md">
                  {t("subtitle")}
                </p>
              </div>
              <div className="w-full md:w-auto flex flex-col sm:flex-row gap-4">
                <div className="flex gap-2">
                  <SearchInput />
                  {/* Mobile Filter Button */}
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        className="lg:hidden shrink-0 h-10 w-10"
                      >
                        <Filter size={18} />
                      </Button>
                    </SheetTrigger>
                    <SheetContent
                      side="left"
                      className="w-[300px] sm:w-[400px] overflow-y-auto p-6"
                    >
                      <SheetHeader className="mb-6 text-left p-0">
                        <SheetTitle>{t("filters")}</SheetTitle>
                      </SheetHeader>
                      <FilterSidebar
                        categories={categories}
                        brands={brands}
                        hideTitle
                        onFilterChange={handleFilter}
                        isPending={isFilterPending}
                        onClearAll={handleClearAllFilters}
                      />
                    </SheetContent>
                  </Sheet>
                </div>
                <Select value={currentSort} onValueChange={handleSortChange}>
                  <SelectTrigger className="w-full sm:w-[180px] h-12! bg-foreground/2 dark:bg-white/2 border-foreground/5 dark:border-white/5 rounded-2xl text-foreground font-medium shadow-sm hover:shadow-md hover:border-foreground/10 transition-all focus:ring-primary/20 focus:border-primary/30">
                    <SelectValue placeholder={t("sortBy")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">{t("newest")}</SelectItem>
                    <SelectItem value="price_asc">{t("priceAsc")}</SelectItem>
                    <SelectItem value="price_desc">{t("priceDesc")}</SelectItem>
                    <SelectItem value="oldest">{t("oldest")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Active Active Filters / Results Count */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <Suspense fallback={<Skeleton className="h-5 w-32" />}>
                <ShopStats productsPromise={productsPromise} />
              </Suspense>

              <AnimatePresence mode="popLayout">
                {hasActiveFilters && (
                  <m.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                    className="flex flex-wrap gap-3"
                  >
                    {activeCategoryName && (
                      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-xs font-black uppercase tracking-wider border border-primary/30 shadow-sm shadow-primary/5">
                        {activeCategoryName}
                        <button
                          onClick={() => handleRemoveFilter("categoryId")}
                          className="hover:text-foreground transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    )}
                    {activeBrandName && (
                      <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-xs font-black uppercase tracking-wider border border-accent/30 shadow-sm shadow-accent/5">
                        {activeBrandName}
                        <button
                          onClick={() => handleRemoveFilter("brandId")}
                          className="hover:text-foreground transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    )}
                    <button
                      onClick={handleClearAllFilters}
                      className="text-xs font-bold text-muted-foreground hover:text-primary underline underline-offset-4 uppercase tracking-wider transition-colors cursor-pointer"
                    >
                      {t("clearAll")}
                    </button>
                  </m.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
            {/* Filters Sidebar - 20% width (1/5) */}
            <FilterSidebar
              categories={categories}
              brands={brands}
              className="hidden lg:block lg:col-span-1 sticky top-24 h-fit"
              onFilterChange={handleFilter}
              isPending={isFilterPending}
              onClearAll={handleClearAllFilters}
            />

            {/* Product Grid - 80% width (4/5) */}
            <div className="lg:col-span-4 space-y-6">
              {/* View Options & Stats Row */}
              <div className="flex flex-col sm:flex-row justify-between items-center bg-background/50 backdrop-blur-sm p-4 rounded-xl border border-border/50 gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground mr-2 hidden sm:inline-block">
                    View
                  </span>
                  <div className="flex bg-muted/30 p-1.5 rounded-2xl border border-foreground/5 relative">
                    {[3, 4, 5].map((col) => {
                      const isActive = columns === col;
                      return (
                        <button
                          key={col}
                          onClick={() => setColumns(col as 3 | 4 | 5)}
                          disabled={isAnyPending}
                          className={cn(
                            "relative px-4 py-2 rounded-xl transition-colors duration-300 z-10",
                            isActive
                              ? "text-foreground"
                              : "text-muted-foreground hover:text-foreground/70",
                            isAnyPending && "opacity-50 cursor-wait"
                          )}
                          title={`${col} Columns`}
                        >
                          {isActive && (
                            <m.div
                              layoutId="activeLayoutGrid"
                              className="absolute inset-0 bg-background shadow-xl shadow-black/5 rounded-xl z-0"
                              transition={{
                                type: "spring",
                                stiffness: 380,
                                damping: 30,
                              }}
                            />
                          )}
                          <div className="relative z-10 flex gap-0.5 items-center justify-center">
                            {Array.from({ length: Math.min(col, 3) }).map(
                              (_, i) => (
                                <div
                                  key={i}
                                  className={cn(
                                    "w-1 h-3 rounded-full transition-all duration-300",
                                    isActive
                                      ? "bg-primary"
                                      : "bg-current opacity-40"
                                  )}
                                />
                              )
                            )}
                            {col > 3 && (
                              <div
                                className={cn(
                                  "w-0.5 h-3 rounded-full transition-all duration-300",
                                  isActive
                                    ? "bg-primary"
                                    : "bg-current opacity-40"
                                )}
                              />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="font-medium order-1 sm:order-2">
                  <Suspense fallback={<Skeleton className="h-5 w-32" />}>
                    <ShopStats productsPromise={productsPromise} />
                  </Suspense>
                </div>
              </div>

              <div
                className={cn(
                  "relative min-h-[400px]",
                  isAnyPending && "cursor-wait"
                )}
              >
                {/* Loading feedback handled by content dimming/blur */}

                <div
                  className={cn(
                    "transition-all duration-300",
                    isAnyPending
                      ? "opacity-30 scale-[0.99] blur-[2px] pointer-events-none"
                      : "opacity-100 scale-100 blur-0"
                  )}
                >
                  <Suspense
                    fallback={<ProductsSkeleton count={12} columns={columns} />}
                  >
                    <ShopGrid
                      productsPromise={productsPromise}
                      suggestedProductsPromise={suggestedProductsPromise}
                      wishlistItems={wishlistItems}
                      columns={columns}
                    />
                  </Suspense>
                </div>

                {isAnyPending && (
                  <div className="absolute inset-0 z-10 animate-in fade-in duration-300">
                    <ProductsSkeleton count={12} columns={columns} />
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
