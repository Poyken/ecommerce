"use client";


import { ProductCard } from "@/features/products/components/product-card";
import { Link } from "@/i18n/routing";
import { fadeInUp, itemVariant, m, staggerContainer } from "@/lib/animations";
import { cn } from "@/lib/utils";
import { Product } from "@/types/models";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { getProductImage } from "@/lib/product-helper";

interface TrendingProductsProps {
  products: Product[];
  title?: string;
  subtitle?: string;
  count?: number;
  columns?: number;
  layout?: "grid" | "carousel";
  alignment?: "left" | "center";
  cardStyle?: "default" | "luxury" | "minimal";
}

export function TrendingProducts({
  products,
  title,
  subtitle,
  count = 10,
  columns = 5,
  layout = "grid",
  alignment = "center",
  cardStyle = "default",
}: TrendingProductsProps) {
  const t = useTranslations("home");
  const inStockProducts = products.filter((product) =>
    product.skus?.some((sku) => sku.stock > 0)
  );
  const displayProducts =
    inStockProducts.length > 0
      ? inStockProducts.slice(0, count)
      : products.slice(0, count);

  const desktopCols =
    {
      2: "lg:grid-cols-2",
      3: "lg:grid-cols-3",
      4: "lg:grid-cols-4",
      5: "lg:grid-cols-5",
      6: "lg:grid-cols-6",
    }[columns] || "xl:grid-cols-5";

  return (
    <section className="w-full">
      <m.div
        className={cn(
          "flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12",
          alignment === "center" && "items-center text-center flex-col",
          alignment === "left" && "items-start text-left"
        )}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeInUp}
      >
        <div className="space-y-3">
          <span className="text-primary font-black uppercase tracking-[0.4em] text-[10px] block mb-2">
            {t("popularItems")}
          </span>
          <h2 className="text-4xl md:text-7xl font-black tracking-tighter text-foreground leading-tight uppercase italic">
            {title || t("trendingNowBold")}
          </h2>
          {subtitle && (
            <p className="text-muted-foreground text-sm max-w-lg font-light leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>

        <div
          className={cn(
            "flex",
            alignment === "center" ? "justify-center" : "justify-end"
          )}
        >
          <Link
            href="/shop"
            className="group text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground hover:text-accent transition-all flex items-center gap-3"
          >
            <span className="relative">
              {t("viewAll") || "View All"}
              <span className="absolute -bottom-1 left-0 w-0 h-px bg-accent transition-all duration-300 group-hover:w-full" />
            </span>
            <ArrowRight
              size={12}
              className="group-hover:translate-x-1.5 transition-transform"
            />
          </Link>
        </div>
      </m.div>

      <m.div
        className={cn(
          "grid grid-cols-2 lg:gap-8 gap-4",
          layout === "grid"
            ? desktopCols
            : "flex overflow-x-auto pb-8 scrollbar-hide"
        )}
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
      >
        {displayProducts.map((product) => (
          <m.div
            key={product.id}
            variants={itemVariant}
            className={layout === "carousel" ? "min-w-[280px]" : ""}
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
              isHot={true}
              skus={product.skus}
              options={product.options}
              variant="luxury"
            />
          </m.div>
        ))}
      </m.div>
    </section>
  );
}
