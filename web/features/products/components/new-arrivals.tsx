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
 * - Grid sản phẩm vẫn dùng `staggerChildren` để hiện lần lượt. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Component giao diện (UI) tái sử dụng, đảm bảo tính nhất quán về thiết kế (Design System).

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
import { getProductImage } from "@/lib/product-helper";

interface NewArrivalsProps {
  products: Product[];
  title?: string;
  subtitle?: string;
  count?: number;
  columns?: number;
  layout?: "grid" | "carousel";
  alignment?: "left" | "center";
}

export function NewArrivals({
  products,
  title,
  subtitle,
  count = 10,
  columns = 5,
  layout = "grid",
  alignment = "left",
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
          "flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12",
          alignment === "center" && "items-center text-center flex-col",
          alignment === "left" && "items-start text-left"
        )}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeInRight}
      >
        <div className="space-y-3">
          <span className="text-secondary font-black uppercase tracking-[0.4em] text-[10px] block mb-2">
            {t("justLaunched")}
          </span>
          <h2 className="text-4xl md:text-7xl font-black tracking-tighter text-foreground leading-tight uppercase italic">
            {title || t("newArrivalsBold")}
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
            href="/shop?sort=newest"
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
              imageUrl={getProductImage(product) || ""}
              category={product.category?.name}
              isNew={true}
              skus={product.skus}
              options={product.options}
              variant="glass"
            />
          </m.div>
        ))}
      </m.div>
    </section>
  );
}
