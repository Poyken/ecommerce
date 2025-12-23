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

import { Button } from "@/components/atoms/button";
import { GlassButton } from "@/components/atoms/glass-button";
import { ProductCard } from "@/components/organisms/product-card";
import { Link, usePathname, useRouter } from "@/i18n/routing";
import { ApiResponse } from "@/types/dtos";
import { Product } from "@/types/models";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { use, useState, useTransition } from "react";

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

  const [now] = useState(() => Date.now());
  const NEW_PRODUCT_THRESHOLD = 14 * 24 * 60 * 60 * 1000;

  return (
    <div className="space-y-10">
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8"
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
        <div className="flex items-center justify-center gap-6 pt-6 border-t border-foreground/5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page <= 1 || isPending}
            className="gap-2 pl-3 font-bold"
          >
            <ChevronLeft className="h-4 w-4" />
            {t("previous")}
          </Button>
          <div className="text-sm font-black tracking-tight">
            {t("page")} {pagination.page} {t("of")} {pagination.lastPage}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page >= pagination.lastPage || isPending}
            className="gap-2 pr-3 font-bold"
          >
            {t("next")}
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
