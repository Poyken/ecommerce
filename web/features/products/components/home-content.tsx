"use client";

import {
  CategoriesSkeleton,
  BrandsSkeleton,
  ProductsSkeleton,
} from "@/features/home/components/skeletons/home-skeleton";
import { FeaturedBrands } from "@/features/brands/components/featured-brands";
import { FeaturedCategories } from "@/features/categories/components/featured-categories";
import { DealSection } from "@/features/marketing/components/deal-section";
import { NewArrivals } from "@/features/products/components/new-arrivals";
import { TrendingProducts } from "@/features/products/components/trending-products";
import { Link } from "@/i18n/routing";
import {
  fadeInLeft,
  fadeInRight,
  fadeInUp,
  scaleUp,
  zoomIn,
} from "@/lib/animations";
import { cn } from "@/lib/utils";
import { Brand, Category, Product } from "@/types/models";
import { m } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import Image from "next/image";
import { Suspense } from "react";

// [TỐI ƯU HÓA P8] Lazy load các component nằm dưới màn hình đầu tiên (below-the-fold)
const TestimonialsCarousel = dynamic(
  () =>
    import("@/features/marketing/components/testimonials-carousel").then(
      (m) => m.TestimonialsCarousel
    ),
  { ssr: true }
);

const FAQAccordion = dynamic(
  () =>
    import("@/features/marketing/components/faq-accordion").then(
      (m) => m.FAQAccordion
    ),
  { ssr: true }
);

const NewsletterForm = dynamic(
  () =>
    import("@/features/marketing/components/newsletter-form").then(
      (m) => m.NewsletterForm
    ),
  { ssr: true }
);

interface HomeContentProps {
  products: Product[];
  categories: Category[];
  brands: Brand[];
}

export function HomeContent({
  products,
  categories,
  brands,
}: HomeContentProps) {
  /**
   * =====================================================================
   * HOME CONTENT - Container chính trang chủ
   * =====================================================================
   *
   * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
   *
   * 1. LAZY LOADING & SUSPENSE:
   * - Các component nặng (Testimonials, FAQ) được `dynamic import` để không block
   *   Render ban đầu.
   * - Các component data (Products, Categories) được bọc trong `Suspense` để hiển thị
   *   Skeleton loading trong khi chờ setup client-side hydration.
   *
   * 2. VIEWPORT ANIMATIONS:
   * - `whileInView="visible"` + `viewport={{ once: true }}`: Chỉ chạy animation
   *   khi user scroll tới vị trí đó (Scroll Trigger). *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Component giao diện (UI) tái sử dụng, đảm bảo tính nhất quán về thiết kế (Design System).

   * =====================================================================
   */
  const t = useTranslations("home");

  return (
    <main className="space-y-24 pb-24 relative overflow-hidden">
      {/* Background Aurora Glows */}
      <div className="absolute top-[5%] -left-[10%] w-[600px] h-[600px] bg-(--aurora-purple)/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute top-[20%] -right-[5%] w-[500px] h-[500px] bg-(--aurora-blue)/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[10%] left-[20%] w-[800px] h-[800px] bg-primary/2 rounded-full blur-[200px] pointer-events-none" />
      <div className="container mx-auto px-4 mt-8">
        <Suspense fallback={<CategoriesSkeleton />}>
          <FeaturedCategories categories={categories} />
        </Suspense>
      </div>

      <div className="container mx-auto px-4">
        <Suspense fallback={<BrandsSkeleton />}>
          <FeaturedBrands brands={brands} />
        </Suspense>
      </div>

      <div className="container mx-auto px-4">
        <Suspense fallback={<ProductsSkeleton count={5} />}>
          <TrendingProducts products={products} />
        </Suspense>
      </div>

      <m.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={zoomIn}
      >
        <DealSection />
      </m.div>

      <div className="container mx-auto px-4">
        <Suspense fallback={<ProductsSkeleton count={4} />}>
          <NewArrivals products={products} />
        </Suspense>
      </div>

      <section className="container mx-auto px-4 overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          <m.div
            className="relative h-[45vh] min-h-[400px] rounded-[2.5rem] overflow-hidden group shadow-2xl"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInLeft}
          >
            <Image
              src="/images/home/promo-living.jpg"
              alt="Promo 1"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover transition-transform duration-700 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-500" />
            <div className="absolute inset-0 flex flex-col justify-end items-start p-10 text-white z-10">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] mb-3 opacity-80">
                Exclusive
              </span>
              <h3 className="text-4xl font-black mb-4 tracking-tighter uppercase italic">
                {t("womensCollection")}
              </h3>
              <p className="text-sm mb-6 text-white/70 font-medium max-w-xs leading-relaxed">
                {t("exploreTrends")}
              </p>
              <Link
                href="/shop?categoryId=living-room"
                className="group/btn inline-flex items-center gap-3 px-8 py-4 bg-white text-black rounded-full font-black text-xs uppercase tracking-widest hover:bg-white/90 transition-all duration-300 shadow-xl"
              >
                {t("shopNow")}
                <ArrowRight
                  size={14}
                  className="group-hover/btn:translate-x-1 transition-transform"
                />
              </Link>
            </div>
          </m.div>
          <m.div
            className="relative h-[45vh] min-h-[400px] rounded-[2.5rem] overflow-hidden group shadow-2xl"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={fadeInRight}
          >
            <Image
              src="/images/home/promo-dining.jpg"
              alt="Promo 2"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover transition-transform duration-700 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-500" />
            <div className="absolute inset-0 flex flex-col justify-end items-start p-10 text-white z-10">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] mb-3 opacity-80">
                Essentials
              </span>
              <h3 className="text-4xl font-black mb-4 tracking-tighter uppercase italic">
                {t("mensEssentials")}
              </h3>
              <p className="text-sm mb-6 text-white/70 font-medium max-w-xs leading-relaxed">
                {t("timelessClassics")}
              </p>
              <Link
                href="/shop?categoryId=dining-space"
                className="group/btn inline-flex items-center gap-3 px-8 py-4 bg-white text-black rounded-full font-black text-xs uppercase tracking-widest hover:bg-white/90 transition-all duration-300 shadow-xl"
              >
                {t("discover")}
                <ArrowRight
                  size={14}
                  className="group-hover/btn:translate-x-1 transition-transform"
                />
              </Link>
            </div>
          </m.div>
        </div>
      </section>

      <section className="container mx-auto px-4">
        <m.div
          className="grid grid-cols-2 md:grid-cols-4 gap-8"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.1 },
            },
          }}
        >
          {[
            { label: "happyCustomers", value: "10k+", color: "primary" },
            { label: "premiumProducts", value: "500+", color: "secondary" },
            { label: "globalBrands", value: "50+", color: "primary" },
            { label: "customerSupport", value: "24/7", color: "secondary" },
          ].map((stat, idx) => (
            <m.div
              key={idx}
              variants={{
                hidden: { opacity: 0, y: 30 },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
                },
              }}
              className="group relative text-center p-10 rounded-[2.5rem] glass-premium border-border/10 hover:border-primary/20 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/5 overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-transparent via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
              <div className="absolute top-4 right-4 h-2 w-2 rounded-full bg-primary/20 group-hover:scale-150 transition-transform duration-500" />
              <h3
                className={cn(
                  "text-6xl font-black mb-3 tracking-tighter transition-transform duration-700 group-hover:-translate-y-1 font-sans italic",
                  stat.color === "primary"
                    ? "text-primary"
                    : "text-foreground"
                )}
              >
                {stat.value}
              </h3>
              <p className="text-[11px] font-black uppercase tracking-[0.3em] text-muted-foreground/60 group-hover:text-muted-foreground transition-colors duration-500">
                {t(stat.label)}
              </p>
            </m.div>
          ))}
        </m.div>
      </section>

      <section className="bg-muted/30 py-24 border-y border-border/50 overflow-hidden">
        <div className="container mx-auto px-4">
          <m.div
            className="text-center mb-16"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <span className="text-primary font-black uppercase tracking-[0.4em] text-[10px] mb-6 block">
              {t("testimonials.subtitle")}
            </span>
            <h2 className="text-5xl md:text-7xl font-black tracking-tighter uppercase italic text-foreground">
              {t("testimonials.title")}
            </h2>
          </m.div>
          <m.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <TestimonialsCarousel />
          </m.div>
        </div>
      </section>

      <section className="container mx-auto px-4 max-w-4xl py-12">
        <m.div
          className="text-center mb-16"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
        >
          <span className="text-primary font-black uppercase tracking-[0.3em] text-[10px] mb-4 block">
            {t("faq.subtitle")}
          </span>
          <h2 className="text-4xl font-black tracking-tighter uppercase italic">
            {t("faq.title")}
          </h2>
        </m.div>
        <m.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
        >
          <FAQAccordion />
        </m.div>
      </section>

      <m.section
        className="container mx-auto px-4 py-12"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={scaleUp}
      >
        <div className="relative overflow-hidden glass-premium rounded-[4rem] p-12 md:p-24 text-center border border-white/5 shadow-2xl">
          <div className="absolute top-0 left-0 w-full h-px bg-linear-to-r from-transparent via-white/10 to-transparent" />
          <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-(--aurora-purple)/5 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-(--aurora-blue)/5 rounded-full blur-[120px] translate-x-1/2 translate-y-1/2 pointer-events-none" />

          <NewsletterForm />
        </div>
      </m.section>
    </main>
  );
}
