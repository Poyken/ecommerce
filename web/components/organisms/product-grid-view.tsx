"use client";

import { DataTablePagination } from "@/components/atoms/data-table-pagination";
import { ProductCard } from "@/components/organisms/product-card";
import { cn } from "@/lib/utils";
import { PaginationMeta } from "@/types/dtos";
import { Product } from "@/types/models";
import { AnimatePresence, motion } from "framer-motion";
import {
  Grid2x2,
  Grid3x3,
  LayoutGrid,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

interface ProductGridViewProps {
  products: Product[];
  pagination: PaginationMeta;
}

export function ProductGridView({
  products,
  pagination,
}: ProductGridViewProps) {
  const t = useTranslations("common");
  // Default to 4 columns on large screens
  const [columns, setColumns] = useState<3 | 4 | 5 | 6>(4);

  // Map column count to grid classes
  const gridClasses = {
    3: "lg:grid-cols-3",
    4: "lg:grid-cols-4",
    5: "lg:grid-cols-5",
    6: "lg:grid-cols-6",
  };

  return (
    <div className="space-y-6">
      {/* View Options Control Bar */}
      <div className="flex justify-between items-center bg-background/50 backdrop-blur-sm p-4 rounded-xl border border-border/50">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground mr-2">
            View
          </span>
          <div className="flex bg-muted/50 p-1 rounded-lg">
            <button
              onClick={() => setColumns(3)}
              className={cn(
                "p-2 rounded-md transition-all duration-200",
                columns === 3
                  ? "bg-background text-primary shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
              title="3 Columns"
            >
              <Grid3x3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setColumns(4)}
              className={cn(
                "p-2 rounded-md transition-all duration-200",
                columns === 4
                  ? "bg-background text-primary shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
              title="4 Columns"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setColumns(5)}
              className={cn(
                "p-2 rounded-md transition-all duration-200",
                columns === 5
                  ? "bg-background text-primary shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
              title="5 Columns"
            >
              <Grid2x2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setColumns(6)}
              className={cn(
                "p-2 rounded-md transition-all duration-200",
                columns === 6
                  ? "bg-background text-primary shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
              title="6 Columns"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="text-sm text-muted-foreground font-medium">
            {t("shop.showing", {
                from: (pagination.page - 1) * pagination.limit + 1,
                to: Math.min(pagination.page * pagination.limit, pagination.total),
                total: pagination.total
            })}
        </div>
      </div>

      {/* Grid */}
      <motion.div
        layout
        className={cn(
          "grid grid-cols-2 gap-4 md:gap-6",
          gridClasses[columns]
        )}
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
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
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
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>

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
