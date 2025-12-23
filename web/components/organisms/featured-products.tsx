/**
 * =====================================================================
 * FEATURED PRODUCTS - Danh sách sản phẩm nổi bật (Blog)
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. CONTEXTUAL PRODUCTS:
 * - Hiển thị các sản phẩm liên quan trực tiếp đến nội dung bài viết Blog.
 * - Giúp tăng khả năng bán hàng (Cross-selling) ngay khi người dùng đang đọc tin tức.
 *
 * 2. STAGGERED GRID:
 * - Sử dụng Framer Motion để tạo hiệu ứng xuất hiện lần lượt cho các thẻ sản phẩm.
 * =====================================================================
 */

"use client";

import { ProductCard } from "@/components/organisms/product-card";
import { Product } from "@/types/models";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

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
    <motion.section
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
          <motion.div key={product.id} variants={itemVariants}>
            <ProductCard
              id={product.id}
              name={product.name}
              price={Number(product.skus?.[0]?.price || 0)}
              originalPrice={
                product.skus?.[0]?.salePrice
                  ? Number(product.skus[0].salePrice)
                  : undefined
              }
              imageUrl={
                (typeof product.images?.[0] === "string"
                  ? product.images?.[0]
                  : product.images?.[0]?.url) || "/placeholder-product.png"
              }
              category={product.category?.name}
              skus={product.skus}
            />
          </motion.div>
        ))}
      </div>
    </motion.section>
  );
}
