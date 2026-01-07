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
import { ProductCard } from "@/features/products/components/product-card";
import { Link } from "@/i18n/routing";
import {
  fadeInRight,
  itemVariant,
  m,
  staggerContainer,
} from "@/lib/animations";
import { cn } from "@/lib/utils";
import { Product } from "@/types/models";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";

interface NewArrivalsProps {
  products: Product[];
  title?: string;
  subtitle?: string;
  count?: number;
  columns?: number;
  layout?: "grid" | "carousel";
  alignment?: "left" | "center";
  cardStyle?: "default" | "luxury" | "minimal";
}

export function NewArrivals({
  products,
  title,
  subtitle,
  count = 8,
  columns = 4,
  layout = "grid",
  alignment = "left",
  cardStyle = "default",
}: NewArrivalsProps) {
  const t = useTranslations("home");
  const inStockProducts = products.filter((product) =>
    product.skus?.some((sku) => sku.stock > 0)
  );
  // For New Arrivals, we often want the most recent ones
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
    }[columns] || "lg:grid-cols-4";

  return (
    <section className="w-full">
      <m.div
        className={cn(
          "flex flex-col md:flex-row justify-between items-center md:items-end gap-8 mb-16",
          alignment === "center" && "md:flex-col md:items-center text-center"
        )}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeInRight}
      >
        <div
          className={cn(
            "space-y-4",
            alignment === "center" ? "text-center" : "text-left"
          )}
        >
          <span className="text-accent font-bold uppercase tracking-[0.3em] text-[10px] block">
            {t("justLaunched")}
          </span>
          <h2 className="text-4xl md:text-5xl font-serif tracking-tight text-foreground">
            {title || t("newArrivalsBold")}
          </h2>
          {subtitle && (
            <p className="text-muted-foreground text-sm max-w-xl font-light leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>

        <Link
          href="/shop?sort=newest"
          className="group flex items-center gap-3 px-10 py-4 rounded-full border border-border bg-secondary/50 backdrop-blur-md hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all duration-500 font-bold text-[10px] uppercase tracking-[0.2em]"
        >
          {t("allProducts")}
          <ArrowRight
            size={14}
            className="transition-transform group-hover:translate-x-2"
          />
        </Link>
      </m.div>

      <m.div
        className={cn(
          "grid grid-cols-2 gap-4 md:gap-8",
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
          </m.div>
        ))}
      </m.div>
    </section>
  );
}
