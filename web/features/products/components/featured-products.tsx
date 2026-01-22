

"use client";

import { ProductCard } from "@/features/products/components/product-card";
import { Product } from "@/types/models";
import { m } from "@/lib/animations";
import { useTranslations } from "next-intl";
import { getProductImage } from "@/lib/product-helper";

interface FeaturedProductsProps {
  products: Product[];
}

/**
 * FeaturedProducts component displays related products in a blog post
 */
export function FeaturedProducts({ products }: FeaturedProductsProps) {
  const t = useTranslations("blog");

  if (!products || products.length === 0) {
    return null;
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
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

  return (
    <m.section
      className="mt-24 pt-16 border-t border-foreground/5"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <div className="mb-12">
        <span className="text-primary font-black uppercase tracking-[0.3em] text-[10px] mb-3 block">
          {t("featuredProducts")}
        </span>
        <h2 className="text-4xl font-black tracking-tighter uppercase italic mb-3">
          {t("featuredProducts")}
        </h2>
        <p className="text-muted-foreground/60 font-medium text-sm">
          {t("featuredProductsDesc")}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {products.map((product) => (
          <m.div key={product.id} variants={itemVariants}>
            <ProductCard
              id={product.id}
              name={product.name}
              price={Number(product.skus?.[0]?.price || 0)}
              originalPrice={
                product.skus?.[0]?.salePrice
                  ? Number(product.skus[0].salePrice)
                  : undefined
              }
              imageUrl={getProductImage(product)}
              category={product.category?.name}
              skus={product.skus}
            />
          </m.div>
        ))}
      </div>
    </m.section>
  );
}
