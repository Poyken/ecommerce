"use client";

import { BackgroundBlob } from "@/components/atoms/background-blob";
import { DealSection } from "@/components/organisms/deal-section";
import { FAQAccordion } from "@/components/organisms/faq-accordion";
import { FeaturedBrands } from "@/components/organisms/featured-brands";
import { FeaturedCategories } from "@/components/organisms/featured-categories";
import { HeroSection } from "@/components/organisms/hero-section";
import { NewArrivals } from "@/components/organisms/new-arrivals";
import { NewsletterForm } from "@/components/organisms/newsletter-form";
import {
  CategoriesSkeleton,
  ProductsSkeleton,
} from "@/components/organisms/skeletons/home-skeleton";
import { TestimonialsCarousel } from "@/components/organisms/testimonials-carousel";
import { TrendingProducts } from "@/components/organisms/trending-products";
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
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import Image from "next/image";
import { Suspense } from "react";

/**
 * =====================================================================
 * HOME CONTENT - Nội dung chính của trang chủ
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. COMPOSITION PATTERN:
 * - `HomeContent` đóng vai trò là "Container" component.
 * - Nó tập hợp các section nhỏ hơn (Hero, Featured, Trending...) để tạo thành trang hoàn chỉnh.
 *
 * 2. REACT SUSPENSE & STREAMING:
 * - Mỗi section nặng (cần fetch data) được bọc trong `<Suspense>`.
 * - `fallback`: Hiển thị Skeleton (khung xương loading) trong khi chờ data.
 * - Giúp trang hiển thị ngay lập tức (Instant Loading), các phần nặng sẽ hiện dần sau.
 *
 * 3. PROMISE PROPS:
 * - Thay vì await data ở Page rồi mới truyền xuống, ta truyền `Promise` xuống.
 * - Component con sẽ `use(promise)` để unwrap data.
 * - Đây là pattern mới trong React Server Components để tối ưu hiệu suất.
 * =====================================================================
 */

interface HomeContentProps {
  productsPromise: Promise<Product[]>;
  categoriesPromise: Promise<Category[]>;
  brandsPromise: Promise<Brand[]>;
}

export function HomeContent({
  productsPromise,
  categoriesPromise,
  brandsPromise,
}: HomeContentProps) {
  const t = useTranslations("home");

  return (
    <div className="min-h-screen bg-background font-sans selection:bg-primary/30 relative overflow-hidden">
      <BackgroundBlob
        variant="primary"
        position="center-left"
        className="top-0 bottom-auto -translate-x-1/2 blur-[160px] opacity-20"
      />
      <BackgroundBlob
        variant="secondary"
        position="center-right"
        className="top-1/4 blur-[160px] opacity-20"
      />
      <HeroSection />

      <main className="space-y-16 pb-16">
        {/* 1. Featured Categories */}
        <Suspense
          fallback={
            <div className="container mx-auto px-4 mt-8">
              <CategoriesSkeleton />
            </div>
          }
        >
          <FeaturedCategories categoriesPromise={categoriesPromise} />
        </Suspense>

        {/* 1.5 Featured Brands */}
        <Suspense fallback={null}>
          <FeaturedBrands brandsPromise={brandsPromise} />
        </Suspense>

        {/* 2. Trending Now */}
        <Suspense
          fallback={
            <div className="container mx-auto px-4">
              <ProductsSkeleton count={5} />
            </div>
          }
        >
          <TrendingProducts productsPromise={productsPromise} />
        </Suspense>

        {/* 3. Deal of the Month */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={zoomIn}
        >
          <DealSection />
        </motion.div>

        {/* 4. New Arrivals */}
        <Suspense
          fallback={
            <div className="container mx-auto px-4">
              <ProductsSkeleton count={4} />
            </div>
          }
        >
          <NewArrivals productsPromise={productsPromise} />
        </Suspense>

        {/* 5. Promotional Banners - Luxe Style */}
        <section className="container mx-auto px-4 overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <motion.div
              className="relative h-[45vh] min-h-[400px] rounded-[2.5rem] overflow-hidden group shadow-2xl"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={fadeInLeft}
            >
              <Image
                src="https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=2000&auto=format&fit=crop"
                alt="Promo 1"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-500" />
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
                  href="/shop?categoryId=women"
                  className="group/btn inline-flex items-center gap-3 px-8 py-4 bg-white text-black rounded-full font-black text-xs uppercase tracking-widest hover:bg-white/90 transition-all duration-300 shadow-xl"
                >
                  {t("shopNow")}
                  <ArrowRight
                    size={14}
                    className="group-hover/btn:translate-x-1 transition-transform"
                  />
                </Link>
              </div>
            </motion.div>
            <motion.div
              className="relative h-[45vh] min-h-[400px] rounded-[2.5rem] overflow-hidden group shadow-2xl"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={fadeInRight}
            >
              <Image
                src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2000&auto=format&fit=crop"
                alt="Promo 2"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                className="object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-40 transition-opacity duration-500" />
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
                  href="/shop?categoryId=men"
                  className="group/btn inline-flex items-center gap-3 px-8 py-4 bg-white text-black rounded-full font-black text-xs uppercase tracking-widest hover:bg-white/90 transition-all duration-300 shadow-xl"
                >
                  {t("discover")}
                  <ArrowRight
                    size={14}
                    className="group-hover/btn:translate-x-1 transition-transform"
                  />
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Stats Section - Luxe Style */}
        <section className="container mx-auto px-4">
          <motion.div
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
              <motion.div
                key={idx}
                variants={{
                  hidden: { opacity: 0, y: 30 },
                  visible: {
                    opacity: 1,
                    y: 0,
                    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
                  },
                }}
                className="group relative text-center p-8 rounded-[2rem] bg-foreground/[0.02] border border-foreground/5 hover:border-primary/20 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/5"
              >
                <div className="absolute top-4 right-4 h-2 w-2 rounded-full bg-primary/20 group-hover:scale-150 transition-transform duration-500" />
                <h3
                  className={cn(
                    "text-5xl font-black mb-2 tracking-tighter transition-transform duration-500 group-hover:-translate-y-1",
                    stat.color === "primary"
                      ? "text-primary"
                      : "text-muted-foreground"
                  )}
                >
                  {stat.value}
                </h3>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
                  {t(stat.label)}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* 6. Testimonials - Luxe Style */}
        <section className="bg-foreground/[0.02] py-24 border-y border-foreground/5 overflow-hidden">
          <div className="container mx-auto px-4">
            <motion.div
              className="text-center mb-16"
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
            >
              <span className="text-primary font-black uppercase tracking-[0.3em] text-[10px] mb-4 block">
                {t("testimonials.subtitle")}
              </span>
              <h2 className="text-4xl md:text-5xl font-black tracking-tighter uppercase italic">
                {t("testimonials.title")}
              </h2>
            </motion.div>
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeInUp}
            >
              <TestimonialsCarousel />
            </motion.div>
          </div>
        </section>

        {/* 7. FAQ - Luxe Style */}
        <section className="container mx-auto px-4 max-w-4xl py-12">
          <motion.div
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
          </motion.div>
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <FAQAccordion />
          </motion.div>
        </section>

        {/* 8. Newsletter - Luxe Style */}
        <motion.section
          className="container mx-auto px-4 py-12"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={scaleUp}
        >
          <div className="relative overflow-hidden bg-foreground/[0.02] rounded-[3rem] p-12 md:p-24 text-center border border-foreground/5 shadow-2xl backdrop-blur-xl">
            {/* Minimalist decorative elements */}
            <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-secondary/5 rounded-full blur-[120px] translate-x-1/2 translate-y-1/2 pointer-events-none" />

            <NewsletterForm />
          </div>
        </motion.section>
      </main>
    </div>
  );
}
