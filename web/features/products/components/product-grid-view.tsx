"use client";

import { DataTablePagination } from "@/components/shared/data-table-pagination";
import { ProductCard } from "@/features/products/components/product-card";
import { usePathname, useRouter } from "@/i18n/routing";
import { m } from "@/lib/animations";
import { cn } from "@/lib/utils";
import { PaginationMeta } from "@/types/dtos";
import { Product } from "@/types/models";
import { AnimatePresence } from "framer-motion";
import { Grid2x2, Grid3x3, LayoutGrid } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * =====================================================================
 * PRODUCT GRID VIEW - Lưới sản phẩm (Grid View)
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. LAYOUT ANIMATIONS (Framer Motion):
 * - Sử dụng `layout` prop của framer-motion để tự động tạo animation khi layout thay đổi.
 * - Khi user đổi số cột (3 -> 4 -> 5), các items sẽ bay về vị trí mới mượt mà thay vì nhảy cục súc.
 *
 * 2. URL-DRIVEN STATE:
 * - Số lượng cột (`columns`) được lưu trên URL (`?columns=3`).
 * - Giúp giữ nguyên trạng thái hiển thị khi user reload trnag hoặc chia sẻ link.
 *
 * 3. ANNOUNCE CHANGES (A11y):
 * - Cần chú ý về Accessibility khi thay đổi layout động, tuy nhiên ở mức độ cơ bản này ta tập trung vào Visual UX. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Component giao diện (UI) tái sử dụng, đảm bảo tính nhất quán về thiết kế (Design System).

 * =====================================================================
 */
interface ProductGridViewProps {
  products: Product[];
  pagination: PaginationMeta;
}

export function ProductGridView({
  products,
  pagination,
}: ProductGridViewProps) {
  const t = useTranslations("shop");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Persist columns in URL
  const columnsParam = searchParams.get("columns");
  const initialColumns = (Number(columnsParam) || 4) as 3 | 4 | 5;
  const [columns, setColumnsState] = useState<3 | 4 | 5>(initialColumns);

  // Sync state with URL
  useEffect(() => {
    if (columnsParam) {
      const val = Number(columnsParam);
      if (val === 3 || val === 4 || val === 5) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setColumnsState(val as 3 | 4 | 5);
      }
    }
  }, [columnsParam]);

  const setColumns = (newCols: 3 | 4 | 5) => {
    setColumnsState(newCols);
    const params = new URLSearchParams(searchParams.toString());
    params.set("columns", newCols.toString());
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  // Map column count to grid classes
  const gridClasses = {
    3: "lg:grid-cols-3",
    4: "lg:grid-cols-4",
    5: "lg:grid-cols-5",
  };

  return (
    <div className="space-y-6">
      {/* View Options Control Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 rounded-[2.5rem] bg-foreground/3 border border-foreground/8 backdrop-blur-2xl shadow-sm gap-6">
        <div className="flex items-center gap-6">
          <span className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/50 whitespace-nowrap">
            Layout Grid
          </span>
          <div className="relative flex bg-foreground/3 p-1.5 rounded-[1.25rem] border border-foreground/5">
            {[3, 4, 5].map((val) => {
              const Icon =
                val === 3 ? Grid3x3 : val === 4 ? LayoutGrid : Grid2x2;
              const isActive = columns === val;

              return (
                <button
                  key={val}
                  onClick={() => setColumns(val as 3 | 4 | 5)}
                  className={cn(
                    "relative p-3.5 rounded-xl transition-all duration-300 z-10",
                    isActive
                      ? "text-primary brightness-110"
                      : "text-muted-foreground/30 hover:text-foreground/60 hover:bg-foreground/2"
                  )}
                  title={`${val} Columns`}
                >
                  <Icon
                    className={cn(
                      "w-4 h-4 transition-transform duration-300",
                      isActive && "scale-110"
                    )}
                  />
                  {isActive && (
                    <m.div
                      layoutId="activeGridView"
                      className="absolute inset-0 bg-background rounded-xl shadow-[0_8px_24px_-12px_rgba(0,0,0,0.15)] -z-10"
                      transition={{
                        type: "spring",
                        stiffness: 450,
                        damping: 35,
                      }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="h-1 w-1 rounded-full bg-primary/30" />
          <div className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/80">
            {t("shop.showing", {
              from: (pagination.page - 1) * pagination.limit + 1,
              to: Math.min(
                pagination.page * pagination.limit,
                pagination.total
              ),
              total: pagination.total,
            })}
          </div>
        </div>
      </div>

      {/* Grid */}
      <m.div
        layout
        className={cn(
          "grid grid-cols-2 gap-4 md:gap-6 lg:gap-8",
          gridClasses[columns]
        )}
        transition={{
          layout: {
            type: "spring",
            stiffness: 250,
            damping: 30,
            mass: 1,
          },
        }}
      >
        <AnimatePresence mode="popLayout">
          {products.map((product) => {
            const imageUrl =
              (typeof product.images?.[0] === "string"
                ? product.images?.[0]
                : product.images?.[0]?.url) ||
              product.skus?.[0]?.imageUrl ||
              "";

            return (
              <m.div
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{
                  opacity: { duration: 0.2 },
                  layout: {
                    type: "spring",
                    stiffness: 250,
                    damping: 30,
                    mass: 1,
                  },
                }}
                key={product.id}
              >
                <ProductCard
                  id={product.id}
                  name={product.name}
                  price={Number(product.skus?.[0]?.price || 0)}
                  originalPrice={
                    product.skus?.[0]?.originalPrice
                      ? Number(product.skus?.[0]?.originalPrice)
                      : undefined
                  }
                  imageUrl={imageUrl}
                  category={product.category?.name}
                  skus={product.skus}
                  options={product.options}
                  className="h-full"
                />
              </m.div>
            );
          })}
        </AnimatePresence>
      </m.div>

      {/* Pagination */}
      {pagination && pagination.lastPage > 1 && (
        <div className="mt-12 flex justify-center">
          <DataTablePagination
            page={pagination.page}
            total={pagination.total}
            limit={pagination.limit}
          />
        </div>
      )}
    </div>
  );
}
