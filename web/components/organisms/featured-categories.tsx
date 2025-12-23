"use client";

/**
 * =====================================================================
 * FEATURED CATEGORIES - Section danh mục nổi bật
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. DATA FETCHING:
 * - Nhận `categoriesPromise` từ Server Component (Page).
 * - Sử dụng `use()` để unwrap promise.
 *
 * 2. GRID LAYOUT:
 * - Hiển thị 4 danh mục đầu tiên trên một hàng (desktop).
 * - Responsive: 1 cột (mobile) -> 2 cột (tablet) -> 4 cột (desktop).
 *
 * 3. REUSABLE COMPONENT:
 * - Sử dụng `CategoryCard` để hiển thị từng item.
 * - Đảm bảo tính nhất quán về giao diện giữa các trang.
 * =====================================================================
 */
import { CategoryCard } from "@/components/molecules/category-card";
import { Link } from "@/i18n/routing";
import { fadeInUp, itemScaleVariant, staggerContainer } from "@/lib/animations";
import { Category } from "@/types/models";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { use } from "react";

interface FeaturedCategoriesProps {
  categoriesPromise: Promise<Category[]>;
}

export function FeaturedCategories({
  categoriesPromise,
}: FeaturedCategoriesProps) {
  const t = useTranslations("home");
  const categories = use(categoriesPromise);

  return (
    <section className="container mx-auto px-4 mt-8">
      <motion.div
        className="flex justify-between items-end mb-10"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeInUp}
      >
        <div>
          <span className="text-primary font-black uppercase tracking-[0.2em] text-[10px] mb-3 block">
            {t("featuredCollections")}
          </span>
          <h2 className="text-4xl font-black tracking-tighter uppercase italic">
            {t("featuredCategories")}
          </h2>
        </div>
        <Link
          href="/categories"
          className="group text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors flex items-center gap-3"
        >
          <span className="relative">
            {t("viewAllCategories")}
            <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-primary transition-all duration-300 group-hover:w-full" />
          </span>
          <ArrowRight
            size={14}
            className="group-hover:translate-x-1 transition-transform"
          />
        </Link>
      </motion.div>
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6"
        variants={staggerContainer}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
      >
        {categories.slice(0, 4).map((category) => (
          <motion.div key={category.id} variants={itemScaleVariant}>
            <CategoryCard
              id={category.id}
              name={category.name}
              count={category.productCount || 0}
              imageUrl={category.imageUrl || undefined}
            />
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
