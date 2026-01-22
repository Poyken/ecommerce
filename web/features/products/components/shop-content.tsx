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
    <div className="min-h-screen bg-background font-sans selection:bg-accent/30 relative overflow-hidden transition-colors duration-500">
      {/* Cinematic Backgrounds */}
      <div className="fixed inset-0 bg-cinematic pointer-events-none z-0 opacity-40" />
      <div className="fixed top-[-10%] left-[-10%] w-[60vw] h-[60vw] bg-(--aurora-purple)/15 rounded-full blur-[150px] animate-pulse-glow z-0 pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-(--aurora-blue)/15 rounded-full blur-[150px] animate-float z-0 pointer-events-none" />

      <main className="container relative mx-auto px-4 md:px-8 pt-32 pb-24 space-y-12 z-10">
        {/* Breadcrumb Navigation */}
        <BreadcrumbNav items={[{ label: t("title") }]} className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60" />

        <section id="collection" className="space-y-8">
          {/* Header & Controls */}
          <div className="space-y-8 border-b border-white/5 pb-10">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10">
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-premium border border-white/10 text-accent text-[10px] font-black uppercase tracking-[0.3em]">
                   <div className="size-1.5 rounded-full bg-accent animate-pulse" />
                   <span>Curated Selection</span>
                </div>
                <h1 className="text-6xl md:text-8xl font-bold tracking-tighter leading-none bg-clip-text text-transparent bg-linear-to-b from-foreground to-foreground/40">
                  <span className="block">{t("title")}</span>
                  <span className="font-serif italic font-normal text-muted-foreground/60 block mt-4">Luxury Essentials</span>
                </h1>
                <p className="text-xl text-muted-foreground/80 font-medium max-w-xl">
                  {t("subtitle")}
                </p>
              </div>
              <div className="w-full lg:w-auto flex flex-col sm:flex-row gap-6">
                <div className="flex gap-4">
                  <SearchInput className="h-14! rounded-2xl!" />
                  {/* Mobile Filter Button */}
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button
                        variant="outline"
                        size="icon"
                        className="lg:hidden shrink-0 h-14 w-14 rounded-2xl glass-premium border-white/10"
                      >
                        <Filter size={20} />
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
                  <SelectTrigger className="w-full sm:w-[220px] h-14! bg-white/5 border-white/10 rounded-2xl text-foreground font-black uppercase text-[10px] tracking-widest shadow-2xl hover:bg-white/10 transition-all focus:ring-accent/20">
                    <SelectValue placeholder={t("sortBy")} />
                  </SelectTrigger>
                  <SelectContent className="glass-premium border-white/10">
                    <SelectItem value="newest" className="font-medium">{t("newest")}</SelectItem>
                    <SelectItem value="price_asc" className="font-medium">{t("priceAsc")}</SelectItem>
                    <SelectItem value="price_desc" className="font-medium">{t("priceDesc")}</SelectItem>
                    <SelectItem value="oldest" className="font-medium">{t("oldest")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Active Active Filters / Results Count */}
            <div className="flex flex-wrap items-center justify-between gap-6">
              <div className="px-5 py-2 rounded-full glass-premium border border-white/10 shadow-2xl">
                <Suspense fallback={<Skeleton className="h-4 w-32 bg-white/5" />}>
                  <div className="text-[10px] font-black uppercase tracking-[0.3em] text-accent">
                    <ShopStats productsPromise={productsPromise} />
                  </div>
                </Suspense>
              </div>

              <AnimatePresence mode="popLayout">
                {hasActiveFilters && (
                  <m.div
                    initial={{ opacity: 0, scale: 0.9, x: 20 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.9, x: 20 }}
                    className="flex flex-wrap gap-3"
                  >
                    {activeCategoryName && (
                      <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-2xl glass-premium bg-accent/20 text-accent text-[10px] font-black uppercase tracking-widest border border-accent/20 shadow-2xl">
                        {activeCategoryName}
                        <button
                          onClick={() => handleRemoveFilter("categoryId")}
                          className="hover:text-white transition-colors p-1 rounded-full hover:bg-accent/40"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    )}
                    {activeBrandName && (
                      <div className="inline-flex items-center gap-3 px-5 py-2.5 rounded-2xl glass-premium border border-white/10 text-white text-[10px] font-black uppercase tracking-widest shadow-2xl">
                        {activeBrandName}
                        <button
                          onClick={() => handleRemoveFilter("brandId")}
                          className="hover:text-accent transition-colors p-1 rounded-full hover:bg-white/10"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    )}
                    <button
                      onClick={handleClearAllFilters}
                      className="text-[10px] font-black text-muted-foreground/60 hover:text-accent transition-all uppercase tracking-[0.3em] px-5 py-2.5 rounded-2xl hover:bg-white/5"
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
              <div className="flex flex-col sm:flex-row justify-between items-center glass-card p-2 rounded-2xl border-white/5 gap-4 shadow-2xl">
                <div className="flex items-center gap-2">
                  <div className="flex bg-white/5 p-1 rounded-xl border border-white/5 relative">
                    {[3, 4, 5].map((col) => {
                      const isActive = columns === col;
                      return (
                        <button
                          key={col}
                          onClick={() => setColumns(col as 3 | 4 | 5)}
                          disabled={isAnyPending}
                          className={cn(
                            "relative px-5 py-2.5 rounded-lg transition-all duration-500 z-10",
                            isActive
                              ? "text-primary shadow-xl"
                              : "text-muted-foreground/40 hover:text-white",
                            isAnyPending && "opacity-50 cursor-wait"
                          )}
                        >
                          {isActive && (
                            <m.div
                              layoutId="activeLayoutGrid"
                              className="absolute inset-0 bg-white/10 rounded-lg z-0"
                              transition={{
                                type: "spring",
                                stiffness: 400,
                                damping: 30,
                              }}
                            />
                          )}
                          <div className="relative z-10 flex gap-1 items-center justify-center">
                            {Array.from({ length: Math.min(col, 3) }).map(
                              (_, i) => (
                                <div
                                  key={i}
                                  className={cn(
                                    "w-1 h-3 rounded-full transition-all duration-500",
                                    isActive
                                      ? "bg-primary shadow-[0_0_10px_rgba(var(--accent-rgb),0.5)]"
                                      : "bg-current"
                                  )}
                                />
                              )
                            )}
                            {col > 3 && (
                              <div
                                className={cn(
                                  "w-1 h-3 rounded-full transition-all duration-500",
                                  isActive
                                    ? "bg-primary shadow-[0_0_10px_rgba(var(--accent-rgb),0.5)]"
                                    : "bg-current"
                                )}
                              />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="font-black text-[10px] uppercase tracking-[0.3em] text-muted-foreground/40 px-8">
                  <Suspense fallback={<Skeleton className="h-4 w-32 bg-white/5" />}>
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
