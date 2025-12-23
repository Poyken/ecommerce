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
import { ProductCard } from "@/components/organisms/product-card";
import { fadeInUp, itemVariant, staggerContainer } from "@/lib/animations";
import { Product } from "@/types/models";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { use } from "react";

interface TrendingProductsProps {
  productsPromise: Promise<Product[]>;
}

export function TrendingProducts({ productsPromise }: TrendingProductsProps) {
  const t = useTranslations("home");
  const products = use(productsPromise);
  const inStockProducts = products.filter((product) =>
    product.skus?.some((sku) => sku.stock > 0)
  );
  const trendingProducts = inStockProducts.slice(0, 10); // Show first 10 in-stock products

  return (
    <section className="container mx-auto px-4 py-16">
      <motion.div
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
          {t("trendingNowBold")}{" "}
          <span className="font-serif italic font-normal text-gradient-gold">
            {t("trendingNowItalic")}
          </span>
        </h2>
        <div className="w-24 h-1.5 bg-accent/40 rounded-full shadow-lg shadow-accent/20" />
      </motion.div>

      <motion.div
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-8"
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
      >
        {trendingProducts.map((product) => (
          <motion.div key={product.id} variants={itemVariant}>
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
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
