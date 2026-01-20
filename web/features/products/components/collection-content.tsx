"use client";

import { BreadcrumbNav } from "@/components/shared/breadcrumb-nav";
import { ProductCard } from "@/features/products/components/product-card";
import { Link, useRouter, usePathname } from "@/i18n/routing";
import { TypedLink } from "@/lib/typed-navigation";
import { m } from "@/lib/animations";
import { cn } from "@/lib/utils";
import { Product } from "@/types/models";
import { AnimatePresence } from "framer-motion";
import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState, useTransition, Suspense, use } from "react";
import { GlassButton } from "@/components/shared/glass-button";
import { LoadingState } from "@/components/shared/data-states";
import { ProductsSkeleton } from "@/features/home/components/skeletons/home-skeleton";
import { DataTablePagination } from "@/components/shared/data-table-pagination";
import { useSearchParams } from "next/navigation";
import { getProductImage } from "@/lib/product-helper";

interface CollectionContentProps {
  title: string;
  subtitle?: string;
  collectionLabel: string;
  backLabel: string;
  backHref: string;
  productsPromise: Promise<{ data: Product[]; meta: any }>;
  breadcrumbItems: { label: string; href?: string }[];
}

export function CollectionContent({
  title,
  subtitle,
  collectionLabel,
  backLabel,
  backHref,
  productsPromise,
  breadcrumbItems,
}: CollectionContentProps) {
  const tShop = useTranslations("shop");
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

  const isAnyPending = isFilterPending;

  return (
    <div className="min-h-screen bg-transparent pt-28 pb-16 font-sans selection:bg-accent/30 relative overflow-hidden transition-colors duration-500">
      {/* Cinematic Background & Aurora Glow */}
      <div className="fixed inset-0 bg-cinematic pointer-events-none z-0 opacity-40" />
      <div className="fixed top-[-10%] left-[-10%] w-[60vw] h-[60vw] bg-(--aurora-blue)/15 rounded-full blur-[150px] animate-pulse-glow z-0 pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-(--aurora-purple)/15 rounded-full blur-[150px] animate-float z-0 pointer-events-none" />

      <div className="container relative mx-auto px-4 md:px-8 max-w-7xl z-10">
        <BreadcrumbNav items={breadcrumbItems} className="mb-8 text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60" />

        <div className="mb-12 border-b border-white/5 pb-12 relative">
          <TypedLink
            href={backHref as `/${string}`}
            className="group text-accent hover:text-accent/80 mb-8 inline-flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.3em] transition-all"
          >
            <div className="size-8 rounded-lg glass-premium border border-white/10 flex items-center justify-center group-hover:bg-white/10 transition-colors">
              <Search className="size-3 rotate-180" />
            </div>
            <span>{backLabel}</span>
          </TypedLink>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-10 mt-6">
            <div className="space-y-6">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-premium border border-white/10 text-accent text-[10px] font-black uppercase tracking-[0.3em]">
                {collectionLabel}
              </span>
              <h1 className="text-6xl md:text-8xl font-bold tracking-tighter uppercase leading-none bg-clip-text text-transparent bg-linear-to-b from-white to-white/40">
                <span className="block">{title}</span>
                <span className="font-serif italic font-normal text-muted-foreground/60 block mt-4 normal-case tracking-tight">Curated Selection</span>
              </h1>
              <p className="text-xl text-muted-foreground/80 font-medium max-w-xl">
                {subtitle}
              </p>
            </div>

            <div className="flex glass-premium p-1.5 rounded-2xl border border-white/10 relative">
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
                  >
                    {isActive && (
                      <m.div
                        layoutId="activeCollectionGrid"
                        className="absolute inset-0 bg-background shadow-xl shadow-black/5 rounded-xl z-0"
                        transition={{
                          type: "spring",
                          stiffness: 380,
                          damping: 30,
                        }}
                      />
                    )}
                    <div className="relative z-10 flex gap-0.5 items-center justify-center">
                      {Array.from({ length: Math.min(col, 3) }).map((_, i) => (
                        <div
                          key={i}
                          className={cn(
                            "w-1 h-3 rounded-full transition-all duration-300",
                            isActive ? "bg-primary" : "bg-current opacity-40"
                          )}
                        />
                      ))}
                      {col > 3 && (
                        <div
                          className={cn(
                            "w-0.5 h-3 rounded-full transition-all duration-300",
                            isActive ? "bg-primary" : "bg-current opacity-40"
                          )}
                        />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
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
              <CollectionGrid
                productsPromise={productsPromise}
                columns={columns}
              />
            </Suspense>
          </div>

          {/* Shimmer Overlay: Hiển thị skeleton thay vì box loading khi đang filter */}
          {isAnyPending && (
            <div className="absolute inset-0 z-10 animate-in fade-in duration-300">
              <ProductsSkeleton count={12} columns={columns} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CollectionGrid({
  productsPromise,
  columns,
}: {
  productsPromise: Promise<{ data: Product[]; meta: any }>;
  columns: 3 | 4 | 5;
}) {
  const tShop = useTranslations("shop");
  const { data: products, meta: pagination } = use(productsPromise);

  const gridClasses: Record<number, string> = {
    3: "lg:grid-cols-3",
    4: "lg:grid-cols-4",
    5: "lg:grid-cols-5",
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
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

  if (products.length === 0) {
    return (
      <div className="col-span-full flex flex-col items-center justify-center py-24 text-center px-4">
        <div className="relative mb-8">
          <div className="absolute inset-0 bg-primary/5 rounded-full blur-3xl" />
          <div className="relative w-24 h-24 rounded-3xl bg-secondary/30 backdrop-blur-xl border border-foreground/5 flex items-center justify-center shadow-2xl rotate-3">
            <Search size={40} className="text-primary/40 -rotate-3" />
          </div>
        </div>
        <h3 className="text-3xl font-serif font-normal tracking-tight text-foreground mb-3">
          {tShop("noProducts")}
        </h3>
        <p className="text-muted-foreground text-base font-light max-w-sm mb-10">
          {tShop("noProductsDesc")}
        </p>
        <Link href="/shop">
          <GlassButton
            variant="primary"
            className="px-8 h-14 rounded-2xl group"
          >
            <span className="flex items-center gap-2">
              {tShop("browseAllProducts")}
              <m.span
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                →
              </m.span>
            </span>
          </GlassButton>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <AnimatePresence mode="popLayout" initial={false}>
        <m.div
          key={columns}
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          className={cn(
            "grid grid-cols-2 gap-4 md:gap-6 lg:gap-8",
            gridClasses[columns] || "lg:grid-cols-4"
          )}
        >
          {products.map((product) => (
            <m.div
              layout
              key={product.id}
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
                originalPrice={
                  product.skus?.[0]?.originalPrice
                    ? Number(product.skus?.[0]?.originalPrice)
                    : undefined
                }
                imageUrl={getProductImage(product) || ""}
                category={product.category?.name}
                skus={product.skus}
                options={product.options}
                className="h-full"
              />
            </m.div>
          ))}
        </m.div>
      </AnimatePresence>

      {pagination && pagination.lastPage > 1 && (
        <DataTablePagination
          page={pagination.page}
          total={pagination.total}
          limit={pagination.limit || 20}
        />
      )}
    </div>
  );
}
