"use client";

/**
 * =====================================================================
 * TRENDING PRODUCTS - Section sản phẩm xu hướng
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. RESPONSIVE GRID:
 * - Sử dụng Grid System của Tailwind: `grid-cols-1` (mobile) -> `grid-cols-5` (xl).
 * - Đảm bảo hiển thị tốt trên mọi kích thước màn hình.
 *
 * 2. PRODUCT LOGIC:
 * - Hiển thị 4 sản phẩm đầu tiên (`slice(0, 4)`).
 * - Tính toán `originalPrice` để hiển thị giá gốc/giá khuyến mãi nếu có.
 * - `isHot={true}`: Hiển thị badge "Hot" trên card.
 *
 * 3. VIEWPORT ANIMATION:
 * - `viewport={{ once: true }}`: Animation chỉ chạy 1 lần khi user cuộn tới.
 * - Tránh việc animation chạy lại gây rối mắt khi user cuộn lên xuống.
 * =====================================================================
 */
import { ProductCard } from "@/features/products/components/product-card";
import { fadeInUp, itemVariant, m, staggerContainer } from "@/lib/animations";
import { cn } from "@/lib/utils";
import { Product } from "@/types/models";
import { useTranslations } from "next-intl";

interface TrendingProductsProps {
  products: Product[];
  title?: string;
  count?: number;
  columns?: number;
}

export function TrendingProducts({ 
    products, 
    title, 
    count = 10,
    columns = 5
}: TrendingProductsProps) {
  const t = useTranslations("home");
  const inStockProducts = products.filter((product) =>
    product.skus?.some((sku) => sku.stock > 0)
  );
  const trendingProducts = inStockProducts.slice(0, count);

  const desktopCols = {
    2: "lg:grid-cols-2",
    3: "lg:grid-cols-3",
    4: "lg:grid-cols-4",
    5: "lg:grid-cols-5",
  }[columns] || "xl:grid-cols-5";

  return (
    <section className="container mx-auto px-4 py-16">
      <m.div
        className="flex flex-col items-center text-center space-y-4 mb-16"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeInUp}
      >
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent/10 border border-accent/20 shadow-lg shadow-accent/5">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-accent">
            {t("popularItems")}
          </span>
        </div>
        <h2 className="text-4xl md:text-6xl font-sans font-black tracking-tighter">
          {title || (
            <>
                {t("trendingNowBold")}{" "}
                <span className="font-serif italic font-normal text-gradient-gold">
                {t("trendingNowItalic")}
                </span>
            </>
          )}
        </h2>
        <div className="w-24 h-1.5 bg-accent/40 rounded-full shadow-lg shadow-accent/20" />
      </m.div>

      <m.div
        className={cn("grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-8", desktopCols)}
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
      >
        {trendingProducts.map((product) => (
          <m.div key={product.id} variants={itemVariant}>
            <ProductCard
              id={product.id}
              name={product.name}
              price={Number(product.skus?.[0]?.price || 0)}
              originalPrice={
                product.skus?.[0]?.originalPrice
                  ? Number(product.skus?.[0]?.originalPrice)
                  : undefined
              }
              imageUrl={
                (typeof product.images?.[0] === "string"
                  ? product.images?.[0]
                  : product.images?.[0]?.url) ||
                product.skus?.[0]?.imageUrl ||
                ""
              }
              category={product.category?.name}
              isHot={true}
              skus={product.skus}
              options={product.options}
            />
          </m.div>
        ))}
      </m.div>
    </section>
  );
}
