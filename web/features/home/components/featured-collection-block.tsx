"use client";

import { ProductsSkeleton } from "@/features/home/components/skeletons/home-skeleton";
import { ProductCard } from "@/features/products/components/product-card";
import { itemVariant, staggerContainer, m } from "@/lib/animations";
import { cn } from "@/lib/utils";
import { Product } from "@/types/models";
import { ArrowRight, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { Suspense, use } from "react";
import { Link } from "@/i18n/routing";
import { getProductImage } from "@/lib/product-helper";

interface FeaturedCollectionBlockProps {
  data?: {
    products: Promise<Product[]>;
  };
  title?: string;
  subtitle?: string;
  collectionName?: string;
  count?: number;
  columns?: number;
  cardStyle?: "default" | "luxury" | "glass";
  auroraOverlay?: boolean;
}

function FeaturedCollectionContent({
  promise,
  count = 4,
  columns = 4,
  cardStyle = "glass",
}: {
  promise: Promise<Product[]>;
  count?: number;
  columns?: number;
  cardStyle?: "default" | "luxury" | "glass";
}) {
  const products = use(promise);
  const displayProducts = products.slice(0, count);

  const gridCols = {
    2: "grid-cols-2",
    3: "grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-2 lg:grid-cols-4",
  }[columns] || "grid-cols-4";

  return (
    <m.div
      variants={staggerContainer}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true }}
      className={cn("grid gap-6 md:gap-10", gridCols)}
    >
      {displayProducts.map((product) => (
        <m.div key={product.id} variants={itemVariant}>
          <ProductCard
            id={product.id}
            name={product.name}
            price={Number(product.skus?.[0]?.price || 0)}
            imageUrl={getProductImage(product) || ""}
            category={product.category?.name}
            variant={cardStyle}
          />
        </m.div>
      ))}
    </m.div>
  );
}

export function FeaturedCollectionBlock({
  data,
  title,
  subtitle,
  collectionName,
  count = 4,
  columns = 4,
  cardStyle = "glass",
  auroraOverlay = true,
}: FeaturedCollectionBlockProps) {
  const t = useTranslations("home");

  return (
    <section className="relative w-full py-24 md:py-32 overflow-hidden">
      {/* Aurora Effects */}
      {auroraOverlay && (
        <div className="absolute inset-0 pointer-events-none z-0">
          <div className="absolute top-[10%] -left-[5%] w-[40%] h-[40%] bg-blue-500/10 blur-[100px] rounded-full" />
          <div className="absolute bottom-[10%] -right-[5%] w-[40%] h-[40%] bg-purple-500/10 blur-[100px] rounded-full" />
        </div>
      )}

      <div className="container relative z-10 mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-16">
          <div className="space-y-4 max-w-2xl">
            {collectionName && (
              <div className="flex items-center gap-2 text-accent font-bold uppercase tracking-[0.3em] text-[10px]">
                <Sparkles className="size-3" />
                <span>{collectionName}</span>
              </div>
            )}
            <h2 className="text-4xl md:text-7xl font-serif tracking-tighter text-foreground leading-[1.1]">
              {title || "Curated for Excellence"}
            </h2>
            {subtitle && (
              <p className="text-muted-foreground text-lg md:text-xl font-light leading-relaxed max-w-xl">
                {subtitle}
              </p>
            )}
          </div>

          <Link
            href="/shop"
            className="group flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground hover:text-primary transition-all pb-2 border-b border-transparent hover:border-primary w-fit"
          >
            <span>{t("viewAll") || "Explore All"}</span>
            <ArrowRight size={14} className="group-hover:translate-x-1.5 transition-transform" />
          </Link>
        </div>

        {/* Content */}
        {data?.products ? (
          <Suspense fallback={<ProductsSkeleton count={count} />}>
            <FeaturedCollectionContent
              promise={data.products}
              count={count}
              columns={columns}
              cardStyle={cardStyle}
            />
          </Suspense>
        ) : (
          <div className="py-20 text-center glass-premium rounded-3xl border border-dashed border-white/10">
            <p className="text-muted-foreground italic">Connect to a collection to display products</p>
          </div>
        )}
      </div>
    </section>
  );
}
