"use client";

import { BreadcrumbNav } from "@/components/atoms/breadcrumb-nav";
import { Button } from "@/components/atoms/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/atoms/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/atoms/sheet";
import { Skeleton } from "@/components/atoms/skeleton";
import { SearchInput } from "@/components/molecules/search-input";
import { ShopStats } from "@/components/molecules/shop-stats";
import { FilterSidebar } from "@/components/organisms/filter-sidebar";
import { ShopGrid } from "@/components/organisms/shop-grid";
import { ProductsSkeleton } from "@/components/organisms/skeletons/home-skeleton";
import { usePathname, useRouter } from "@/i18n/routing";
import { ApiResponse } from "@/types/dtos";
import { Brand, Category, Product } from "@/types/models";
import { Filter, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Suspense, use, useCallback, useTransition } from "react";

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
 * - `ShopGrid` sẽ unwrap `productsPromise` để hiển thị danh sách sản phẩm.
 * =====================================================================
 */

interface ShopContentProps {
  productsPromise: Promise<ApiResponse<Product[]>>;
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
  const [, startTransition] = useTransition();

  // Unwrap categories and brands for sidebar and active filters
  const categories = use(categoriesPromise);
  const brands = use(brandsPromise);

  // Active Filters Logic
  const currentCategory = searchParams.get("categoryId");
  const currentBrand = searchParams.get("brandId");
  const currentSort = searchParams.get("sort") || "newest";

  const activeCategoryName = categories.find(
    (c) => c.id === currentCategory
  )?.name;
  const activeBrandName = brands.find((b) => b.id === currentBrand)?.name;
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
      if (name !== "page") {
        params.set("page", "1");
      }
      return params.toString();
    },
    [searchParams]
  );

  const handleSortChange = (value: string) => {
    startTransition(() => {
      router.replace(`${pathname}?${createQueryString("sort", value)}`, {
        scroll: false,
      });
    });
  };

  const handleRemoveFilter = (key: string) => {
    startTransition(() => {
      router.replace(`${pathname}?${createQueryString(key, null)}`, {
        scroll: false,
      });
    });
  };

  const handleClearAllFilters = () => {
    startTransition(() => {
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
  };

  return (
    <div className="min-h-screen bg-background font-sans selection:bg-primary/30">
      <main className="container mx-auto px-4 pt-24 pb-12 space-y-6">
        {/* Breadcrumb Navigation */}
        <BreadcrumbNav items={[{ label: t("title") }]} className="text-sm" />

        <section id="collection" className="space-y-6">
          {/* Header & Controls */}
          <div className="space-y-4 border-b border-foreground/5 pb-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
              <div className="space-y-3">
                <h1 className="text-4xl md:text-5xl font-black tracking-tight">
                  {t("title")}
                </h1>
                <p className="text-muted-foreground/70 text-base font-medium">
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

              {hasActiveFilters && (
                <div className="flex flex-wrap gap-3">
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
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
            {/* Filters Sidebar - 20% width (1/5) */}
            <FilterSidebar
              categories={categories}
              brands={brands}
              className="hidden lg:block lg:col-span-1 sticky top-24 h-fit"
            />

            {/* Product Grid - 80% width (4/5) */}
            <div className="lg:col-span-4 space-y-8">
              <Suspense fallback={<ProductsSkeleton count={12} />}>
                <ShopGrid
                  productsPromise={productsPromise}
                  suggestedProductsPromise={suggestedProductsPromise}
                  wishlistItems={wishlistItems}
                />
              </Suspense>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
