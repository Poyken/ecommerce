"use client";

/**
 * =====================================================================
 * FEATURED BRANDS - Section thương hiệu nổi bật
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. DATA FETCHING PATTERN:
 * - Component nhận `brandsPromise` thay vì data trực tiếp.
 * - Sử dụng `use(brandsPromise)` để suspend component cho đến khi data sẵn sàng.
 * - Pattern này cho phép Streaming SSR: Các phần khác của trang load trước, phần này load sau.
 *
 * 2. ANIMATION STAGGER:
 * - `staggerChildren: 0.1`: Các phần tử con sẽ xuất hiện lần lượt cách nhau 0.1s.
 * - Tạo hiệu ứng domino mượt mà thay vì hiện tất cả cùng lúc.
 * =====================================================================
 */
import { BrandCard } from "@/components/molecules/brand-card";
import { Link } from "@/i18n/routing";
import { fadeInUp, itemScaleVariant, staggerContainer } from "@/lib/animations";
import { Brand } from "@/types/models";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { use } from "react";

interface FeaturedBrandsProps {
  brandsPromise: Promise<Brand[]>;
}

export function FeaturedBrands({ brandsPromise }: FeaturedBrandsProps) {
  const t = useTranslations("home");
  const brands = use(brandsPromise);

  return (
    <section className="container mx-auto px-4 mt-16">
      <motion.div
        className="flex justify-between items-end mb-10"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeInUp}
      >
        <div>
          <span className="text-accent font-black uppercase tracking-[0.2em] text-[10px] mb-3 block">
            {t("featuredBrands")}
          </span>
          <h2 className="text-4xl font-black tracking-tighter uppercase italic">
            {t("ourPartners")}
          </h2>
        </div>
        <Link
          href="/brands"
          className="group text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-accent transition-colors flex items-center gap-3"
        >
          <span className="relative">
            {t("viewAllBrands")}
            <span className="absolute -bottom-1 left-0 w-0 h-[2px] bg-accent transition-all duration-300 group-hover:w-full" />
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
        {brands.slice(0, 8).map((brand) => (
          <motion.div key={brand.id} variants={itemScaleVariant}>
            <BrandCard
              id={brand.id}
              name={brand.name}
              count={brand._count?.products || 0}
              imageUrl={brand.imageUrl || undefined}
            />
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
