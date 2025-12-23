"use client";

/**
 * =====================================================================
 * NEW ARRIVALS - Section sản phẩm mới về
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. DATA SLICING:
 * - Nhận toàn bộ danh sách sản phẩm nhưng chỉ hiển thị 4 sản phẩm tiếp theo (`slice(4, 8)`).
 * - Giả định 4 sản phẩm đầu tiên đã dùng cho section "Trending".
 *
 * 2. REUSABLE COMPONENT:
 * - Tái sử dụng `ProductCard` với prop `isNew={true}` để hiển thị badge "New".
 *
 * 3. ANIMATION:
 * - Sử dụng `fadeInRight` cho header để tạo cảm giác chuyển động từ phải sang trái.
 * - Grid sản phẩm vẫn dùng `staggerChildren` để hiện lần lượt.
 * =====================================================================
 */
import { ProductCard } from "@/components/organisms/product-card";
import { Link } from "@/i18n/routing";
import { fadeInRight, itemVariant, staggerContainer } from "@/lib/animations";
import { Product } from "@/types/models";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { use } from "react";

interface NewArrivalsProps {
  productsPromise: Promise<Product[]>;
}

export function NewArrivals({ productsPromise }: NewArrivalsProps) {
  const t = useTranslations("home");
  const products = use(productsPromise);
  const inStockProducts = products.filter((product) =>
    product.skus?.some((sku) => sku.stock > 0)
  );
  const newArrivals = inStockProducts.slice(10, 18); // Show in-stock products from index 10 to 18 to avoid overlap with Trending

  return (
    <section className="container mx-auto px-4 overflow-hidden py-16">
      <motion.div
        className="flex flex-col md:flex-row justify-between items-center md:items-end gap-6 mb-12"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeInRight}
      >
        <div className="text-center md:text-left space-y-2">
          <span className="text-accent font-black uppercase tracking-[0.3em] text-[10px]">
            {t("justLaunched")}
          </span>
          <h2 className="text-4xl md:text-5xl font-sans font-black tracking-tighter">
            {t("newArrivalsBold")}{" "}
            <span className="font-serif italic font-normal text-gradient-gold">
              {t("newArrivalsItalic")}
            </span>
          </h2>
        </div>

        <Link
          href="/shop?sort=newest"
          className="group flex items-center gap-3 px-8 py-4 rounded-full border border-accent/20 bg-accent/5 hover:bg-accent hover:text-accent-foreground transition-all duration-500 font-bold text-xs uppercase tracking-widest shadow-lg shadow-accent/5 hover:shadow-accent/20"
        >
          {t("allProducts")}
          <ArrowRight
            size={16}
            className="transition-transform group-hover:translate-x-2"
          />
        </Link>
      </motion.div>

      <motion.div
        className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8"
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
      >
        {newArrivals.map((product) => (
          <motion.div key={product.id} variants={itemVariant}>
            <ProductCard
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
              isNew={true}
              skus={product.skus}
              options={product.options}
            />
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
