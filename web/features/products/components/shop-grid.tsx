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
 * - Nếu không tìm thấy sản phẩm, hiển thị thông báo kèm theo các sản phẩm gợi ý (`mightLike`) để giữ chân người dùng. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Component giao diện (UI) tái sử dụng, đảm bảo tính nhất quán về thiết kế (Design System).

 * =====================================================================
 */

"use client";

import { DataTablePagination } from "@/components/shared/data-table-pagination";
import { GlassButton } from "@/components/shared/glass-button";
import { ProductCard } from "@/features/products/components/product-card";
import { Link, usePathname, useRouter } from "@/i18n/routing";
import { m } from "@/lib/animations";
import { cn } from "@/lib/utils";
import { Product } from "@/types/models";
import { AnimatePresence } from "framer-motion";
import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { use, useCallback, useEffect, useState } from "react";
import { getProductImage } from "@/lib/product-helper";

interface ShopGridProps {
  productsPromise: Promise<{
    data: Product[];
    meta: { page: number; limit: number; total: number; lastPage: number };
  }>;
  suggestedProductsPromise: Promise<Product[]>;
  wishlistItems?: Product[];
  columns: 3 | 4 | 5;
}

export function ShopGrid({
  productsPromise,
  suggestedProductsPromise,
  wishlistItems = [],
  columns,
}: ShopGridProps) {
  const t = useTranslations("shop");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Null-safe destructuring with defaults
  const productsResult = use(productsPromise);
  const products = productsResult?.data ?? [];
  const pagination = productsResult?.meta;
  
  const suggestedProductsRaw = use(suggestedProductsPromise);
  const suggestedProducts = suggestedProductsRaw ?? [];

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
    hidden: { opacity: 0, scale: 0.95, y: 10 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: "spring" as const,
        stiffness: 200,
        damping: 25,
        opacity: { duration: 0.2 },
      },
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      transition: { duration: 0.2 },
    },
  };

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set(name, value);
      return params.toString();
    },
    [searchParams]
  );

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
      <m.div
        className="space-y-6"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          {products.length > 0 ? (
            <m.div
              key={columns}
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              exit="hidden"
              className={cn(
                "grid grid-cols-2 gap-4 md:gap-6 lg:gap-8 col-span-full",
                gridClasses[columns]
              )}
            >
              {products.map((product) => {
                // Check if product is in wishlist
                const isWishlisted = wishlistItems.some(
                  (item) => item.id === product.id
                );

                return (
                  <m.div
                    layout
                    key={product.id}
                    variants={itemVariants}
                    transition={{
                      layout: {
                        type: "spring",
                        stiffness: 250,
                        damping: 30,
                        mass: 0.8,
                      },
                    }}
                  >
                    <ProductCard
                      id={product.id}
                      name={product.name}
                      price={Number(product.skus?.[0]?.price || 0)}
                      imageUrl={getProductImage(product) || ""}
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
                  </m.div>
                );
              })}
            </m.div>
          ) : (
            <m.div
              layout
              key="empty"
              variants={itemVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="col-span-full flex flex-col items-center justify-center py-24 text-center px-4"
              transition={{
                layout: {
                  type: "spring",
                  stiffness: 150,
                  damping: 25,
                  mass: 1,
                },
              }}
            >
              <div className="relative mb-8">
                <div className="absolute inset-0 bg-primary/5 rounded-full blur-3xl" />
                <div className="relative w-24 h-24 rounded-3xl bg-secondary/30 backdrop-blur-xl border border-foreground/5 flex items-center justify-center shadow-2xl rotate-3">
                  <Search size={40} className="text-primary/40 -rotate-3" />
                </div>
              </div>

              <h3 className="text-3xl font-serif font-normal tracking-tight text-foreground mb-3">
                {t("noProducts")}
              </h3>
              <p className="text-muted-foreground text-base font-light max-w-sm mb-10">
                {t("noProductsDesc")}
              </p>

              <Link href="/shop">
                <GlassButton
                  variant="primary"
                  className="px-8 h-14 rounded-2xl group"
                >
                  <span className="flex items-center gap-2">
                    {t("browseAllProducts")}
                    <m.span
                      animate={{ x: [0, 5, 0] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    >
                      →
                    </m.span>
                  </span>
                </GlassButton>
              </Link>

              {suggestedProducts.length > 0 && (
                <div className="w-full mt-24 space-y-12 animate-in fade-in slide-in-from-bottom-5 duration-1000">
                  <div className="flex flex-col items-center gap-4">
                    <span className="text-[10px] font-black text-primary uppercase tracking-[0.4em]">
                      {t("mightLike")}
                    </span>
                    <h4 className="text-2xl font-serif">
                      {t("curatedForYou")}
                    </h4>
                    <div className="w-12 h-0.5 bg-primary/20 rounded-full" />
                  </div>

                  <div
                    className={cn(
                      "grid grid-cols-2 lg:gap-8 gap-4 w-full text-left",
                      gridClasses[4]
                    )}
                  >
                    {suggestedProducts.slice(0, 4).map((product) => (
                      <ProductCard
                        key={product.id}
                        id={product.id}
                        name={product.name}
                        price={Number(product.skus?.[0]?.price || 0)}
                        imageUrl={getProductImage(product) || ""}
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
            </m.div>
          )}
        </AnimatePresence>
      </m.div>

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
