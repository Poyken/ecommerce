/**
 * =====================================================================
 * SHOP GRID - Lưới danh sách sản phẩm (Trang Cửa hàng)
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. SERVER-CLIENT HYBRID:
 * - Nhận `productsPromise` từ Server Component và sử dụng hook `use()` để giải nén dữ liệu.
 * - Cho phép hiển thị dữ liệu ngay lập tức trong khi vẫn giữ được tính tương tác của Client Component.
 *
 * 2. PAGINATION & ROUTING:
 * - Xử lý phân trang bằng cách cập nhật URL parameter (`page`).
 * - Sử dụng `useTransition` để quá trình chuyển trang mượt mà, không bị khựng UI.
 *
 * 3. EMPTY STATE & SUGGESTIONS:
 * - Nếu không tìm thấy sản phẩm, hiển thị thông báo kèm theo các sản phẩm gợi ý (`mightLike`) để giữ chân người dùng.
 * =====================================================================
 */

"use client";

import { DataTablePagination } from "@/components/atoms/data-table-pagination";
import { GlassButton } from "@/components/atoms/glass-button";
import { ProductCard } from "@/components/organisms/product-card";
import { Link, usePathname, useRouter } from "@/i18n/routing";
import { cn } from "@/lib/utils";
import { ApiResponse } from "@/types/dtos";
import { Product } from "@/types/models";
import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { use, useEffect, useState, useTransition } from "react";

interface ShopGridProps {
  productsPromise: Promise<ApiResponse<Product[]>>;
  suggestedProductsPromise: Promise<Product[]>;
  wishlistItems?: Product[];
}

export function ShopGrid({
  productsPromise,
  suggestedProductsPromise,
  wishlistItems = [],
}: ShopGridProps) {
  const t = useTranslations("shop");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const { data: products, meta: pagination } = use(productsPromise);
  const suggestedProducts = use(suggestedProductsPromise);
  const [columns, setColumns] = useState<3 | 4 | 5 | 6>(4);
  const [now] = useState(() => Date.now());
  const NEW_PRODUCT_THRESHOLD = 14 * 24 * 60 * 60 * 1000;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  const createQueryString = (name: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(name, value);
    return params.toString();
  };

  const handlePageChange = (page: number) => {
    startTransition(() => {
      router.replace(
        `${pathname}?${createQueryString("page", page.toString())}`,
        { scroll: true }
      );
    });
  };

  // Prefetch adjacent pages for faster navigation
  useEffect(() => {
    if (pagination) {
      // Prefetch next page
      if (pagination.page < pagination.lastPage) {
        const nextPageUrl = `${pathname}?${createQueryString(
          "page",
          (pagination.page + 1).toString()
        )}`;
        router.prefetch(nextPageUrl);
      }
      // Prefetch previous page
      if (pagination.page > 1) {
        const prevPageUrl = `${pathname}?${createQueryString(
          "page",
          (pagination.page - 1).toString()
        )}`;
        router.prefetch(prevPageUrl);
      }
    }
  }, [pagination, pathname, router, createQueryString]);

  // Map column count to grid classes
  const gridClasses = {
    3: "lg:grid-cols-3",
    4: "lg:grid-cols-4",
    5: "lg:grid-cols-5",
    6: "lg:grid-cols-6",
  };

  return (
    <div className="space-y-6">
       {/* View Options & Stats */}
       <div className="flex flex-col sm:flex-row justify-between items-center bg-background/50 backdrop-blur-sm p-4 rounded-xl border border-border/50 gap-4">
        <div className="flex items-center gap-2 order-2 sm:order-1">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground mr-2 hidden sm:inline-block">
            View
          </span>
          <div className="flex bg-muted/50 p-1 rounded-lg">
             {[3, 4, 5, 6].map((col) => (
                <button
                  key={col}
                  onClick={() => setColumns(col as 3 | 4 | 5 | 6)}
                  className={cn(
                    "p-2 rounded-md transition-all duration-200 hover:bg-background/80 hover:text-foreground hover:shadow-sm",
                    columns === col
                      ? "bg-background text-primary shadow-sm ring-1 ring-black/5 dark:ring-white/10"
                      : "text-muted-foreground"
                  )}
                  title={`${col} Columns`}
                >
                  <div className="flex gap-0.5">
                    {Array.from({ length: Math.min(col, 3) }).map((_, i) => (
                      <div key={i} className="w-1 h-3 bg-current rounded-full" />
                    ))}
                    {col > 3 && <div className="w-0.5 h-3 bg-current rounded-full" />}
                  </div>
                </button>
             ))}
          </div>
        </div>
        
        {/* Helper text / Showing X of Y */}
        <div className="text-sm text-muted-foreground font-medium order-1 sm:order-2">
            {products.length > 0 && pagination && t("showing", {
                from: (pagination.page - 1) * (pagination.limit || 12) + 1,
                to: Math.min(pagination.page * (pagination.limit || 12), pagination.total),
                total: pagination.total
            })}
        </div>
      </div>

      <motion.div
        className={cn(
            "grid grid-cols-2 gap-4 md:gap-6 lg:gap-8",
             // Mobile always 2, md always 3 or 4? No, let's respect lg choice
             gridClasses[columns] // Applies on lg screens
        )}
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        {products.length > 0 ? (
          products.map((product) => {
            // Check if product is in wishlist
            const isWishlisted = wishlistItems.some(
              (item) => item.id === product.id
            );

            return (
              <ProductCard
                key={product.id}
                id={product.id}
                name={product.name}
                price={Number(product.skus?.[0]?.price || 0)}
                imageUrl={
                  (typeof product.images?.[0] === "string"
                    ? product.images?.[0]
                    : product.images?.[0]?.url) ||
                  product.skus?.[0]?.imageUrl ||
                  ""
                }
                category={product.category?.name}
                isNew={
                  new Date(product.createdAt).getTime() >
                  now - NEW_PRODUCT_THRESHOLD
                }
                skus={product.skus}
                options={product.options}
                className="h-full"
                initialIsWishlisted={isWishlisted}
              />
            );
          })
        ) : (
          <motion.div
            variants={itemVariants}
            className="col-span-full flex flex-col items-center justify-center py-20 text-muted-foreground bg-foreground/2 rounded-4xl border border-foreground/5"
          >
            <Search size={64} className="text-foreground/10 mb-6" />
            <p className="text-2xl font-black text-foreground tracking-tight">
              {t("noProducts")}
            </p>
            <p className="text-sm mt-3 mb-10 font-medium text-muted-foreground/70">
              {t("noProductsDesc")}
            </p>

            {suggestedProducts.length > 0 && (
              <div className="w-full px-8">
                <div className="flex items-center gap-4 mb-8 w-full">
                  <div className="h-px bg-foreground/10 flex-1" />
                  <span className="text-xs font-black text-muted-foreground uppercase tracking-[0.2em]">
                    {t("mightLike")}
                  </span>
                  <div className="h-px bg-foreground/10 flex-1" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full text-left">
                  {suggestedProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      id={product.id}
                      name={product.name}
                      price={Number(product.skus?.[0]?.price || 0)}
                      imageUrl={
                        (typeof product.images?.[0] === "string"
                          ? product.images?.[0]
                          : product.images?.[0]?.url) ||
                        product.skus?.[0]?.imageUrl ||
                        ""
                      }
                      category={product.category?.name}
                      isNew={
                        new Date(product.createdAt).getTime() >
                        now - NEW_PRODUCT_THRESHOLD
                      }
                      skus={product.skus}
                      options={product.options}
                      className="h-full"
                    />
                  ))}
                </div>
              </div>
            )}

            <Link href="/shop" className="mt-10">
              <GlassButton
                variant="secondary"
                className="font-bold uppercase tracking-wide"
              >
                {t("clearFilters")}
              </GlassButton>
            </Link>
          </motion.div>
        )}
      </motion.div>


      {/* Pagination Controls */}
      {pagination && pagination.lastPage > 1 && (
        <DataTablePagination
          page={pagination.page}
          total={pagination.total}
          limit={pagination.limit || 12}
        />
      )}
    </div>
  );
}
