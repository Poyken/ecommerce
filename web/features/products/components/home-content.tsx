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
import { ArrowRight, Sparkles, Zap } from "lucide-react";
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
  
  const t = useTranslations("home");

  return (
    <main className="space-y-24 pb-32 relative overflow-hidden selection:bg-accent/30">
      {/* Background Aurora Glows are handled by HomeWrapper (fixed) */}

      <div className="container mx-auto px-4 mt-8 relative z-10">
        <Suspense fallback={<CategoriesSkeleton />}>
          <FeaturedCategories categories={categories} />
        </Suspense>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <Suspense fallback={<BrandsSkeleton />}>
          <FeaturedBrands brands={brands} />
        </Suspense>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <Suspense fallback={<ProductsSkeleton count={5} />}>
          <TrendingProducts products={products} />
        </Suspense>
      </div>

      <m.div
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={zoomIn}
        className="relative z-10"
      >
        <DealSection />
      </m.div>

      <div className="container mx-auto px-4 relative z-10">
        <Suspense fallback={<ProductsSkeleton count={4} />}>
          <NewArrivals products={products} />
        </Suspense>
      </div>

      <section className="container mx-auto px-4 overflow-hidden relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <m.div
            className="relative h-[50vh] min-h-[450px] rounded-4xl overflow-hidden group shadow-[0_0_80px_rgba(0,0,0,0.1)] border border-white/5"
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
              className="object-cover transition-transform duration-1000 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/30 to-transparent opacity-70 group-hover:opacity-60 transition-opacity duration-1000" />
            <div className="absolute inset-0 flex flex-col justify-end items-start p-12 text-white z-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-[10px] font-black uppercase tracking-[0.3em] mb-4">
                <div className="size-1.5 rounded-full bg-accent animate-pulse" />
                <span>Exclusive</span>
              </div>
              <h3 className="text-5xl font-bold mb-4 tracking-tighter leading-none">
                <span className="block">{t("womensCollection")}</span>
                <span className="font-serif italic font-normal text-white/40 block mt-2 tracking-normal">Signature Series</span>
              </h3>
              <p className="text-base mb-8 text-white/60 font-medium max-w-sm leading-relaxed">
                {t("exploreTrends")}
              </p>
              <Link
                href="/shop?categoryId=living-room"
                className="group/btn inline-flex items-center gap-4 px-10 py-5 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all duration-500 shadow-2xl"
              >
                {t("shopNow")}
                <ArrowRight
                  size={14}
                  className="group-hover/btn:translate-x-1 transition-transform duration-500"
                />
              </Link>
            </div>
          </m.div>

          <m.div
            className="relative h-[50vh] min-h-[450px] rounded-4xl overflow-hidden group shadow-[0_0_80px_rgba(0,0,0,0.1)] border border-white/5"
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
              className="object-cover transition-transform duration-1000 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/30 to-transparent opacity-70 group-hover:opacity-60 transition-opacity duration-1000" />
            <div className="absolute inset-0 flex flex-col justify-end items-start p-12 text-white z-10">
               <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-[10px] font-black uppercase tracking-[0.3em] mb-4">
                <div className="size-1.5 rounded-full bg-accent animate-pulse" />
                <span>Essentials</span>
              </div>
              <h3 className="text-5xl font-bold mb-4 tracking-tighter leading-none">
                <span className="block">{t("mensEssentials")}</span>
                <span className="font-serif italic font-normal text-white/40 block mt-2 tracking-normal">Timeless Pieces</span>
              </h3>
              <p className="text-base mb-8 text-white/60 font-medium max-w-sm leading-relaxed">
                {t("timelessClassics")}
              </p>
              <Link
                href="/shop?categoryId=dining-space"
                className="group/btn inline-flex items-center gap-4 px-10 py-5 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all duration-500 shadow-2xl"
              >
                {t("discover")}
                <ArrowRight
                  size={14}
                  className="group-hover/btn:translate-x-1 transition-transform duration-500"
                />
              </Link>
            </div>
          </m.div>
        </div>
      </section>

      <section className="container mx-auto px-4 relative z-10">
        <m.div
          className="grid grid-cols-2 md:grid-cols-4 gap-10"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: { staggerChildren: 0.15 },
            },
          }}
        >
          {[
            { label: "happyCustomers", value: "10k+", color: "accent" },
            { label: "premiumProducts", value: "500+", color: "white" },
            { label: "globalBrands", value: "50+", color: "accent" },
            { label: "customerSupport", value: "24/7", color: "white" },
          ].map((stat, idx) => (
            <m.div
              key={idx}
              variants={{
                hidden: { opacity: 0, y: 30 },
                visible: {
                  opacity: 1,
                  y: 0,
                  transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] },
                },
              }}
              className="group relative text-center p-12 rounded-4xl glass-card border-white/5 hover:bg-white/5 transition-all duration-700 hover:scale-[1.05] overflow-hidden shadow-2xl"
            >
              <div className="absolute top-0 left-0 w-full h-px bg-linear-to-r from-transparent via-accent/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
              <div className="absolute -bottom-8 -right-8 size-24 bg-accent/5 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-1000" />
              
              <h3
                className={cn(
                  "text-6xl font-black mb-4 tracking-tighter transition-transform duration-700 group-hover:-translate-y-2 font-serif italic text-transparent bg-clip-text bg-linear-to-b",
                  stat.color === "accent"
                    ? "from-accent to-accent/40"
                    : "from-foreground to-foreground/40"
                )}
              >
                {stat.value}
              </h3>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground/40 group-hover:text-muted-foreground/80 transition-colors duration-700">
                {t(stat.label)}
              </p>
            </m.div>
          ))}
        </m.div>
      </section>

      <section className="relative z-10 py-32 bg-cinematic/40 border-y border-white/5">
        {/* Section Aurora */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-accent/2 rounded-full blur-[180px] pointer-events-none" />
        
        <div className="container mx-auto px-4 relative z-10">
          <m.div
            className="text-center mb-24 space-y-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-premium border border-white/10 text-accent text-[10px] font-black uppercase tracking-[0.3em]">
               <Sparkles className="size-3" />
               <span>{t("testimonials.subtitle")}</span>
            </div>
            <h2 className="text-6xl md:text-8xl font-bold tracking-tighter leading-none bg-clip-text text-transparent bg-linear-to-b from-foreground to-foreground/40">
              <span className="block">{t("testimonials.title")}</span>
              <span className="font-serif italic font-normal text-muted-foreground/60 block mt-4">Verified Experience</span>
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

      <section className="container mx-auto px-4 max-w-5xl py-32 relative z-10">
        <m.div
          className="text-center mb-20 space-y-6"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass-premium border border-white/10 text-accent text-[10px] font-black uppercase tracking-[0.3em]">
             <ArrowRight className="size-3" />
             <span>{t("faq.subtitle")}</span>
          </div>
          <h2 className="text-5xl md:text-7xl font-bold tracking-tighter leading-none">
            <span className="block">{t("faq.title")}</span>
            <span className="font-serif italic font-normal text-muted-foreground/60 block mt-2">Personal Assistance</span>
          </h2>
        </m.div>
        <m.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          className="glass-card border-white/5 rounded-4xl p-8 md:p-12 shadow-2xl"
        >
          <FAQAccordion />
        </m.div>
      </section>

      <m.section
        className="container mx-auto px-4 py-20 relative z-10"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        variants={scaleUp}
      >
        <div className="relative overflow-hidden glass-premium rounded-[4rem] p-16 md:p-32 text-center border border-white/5 shadow-[0_0_100px_rgba(255,255,255,0.02)]">
          <div className="absolute top-0 left-0 w-full h-px bg-linear-to-r from-transparent via-white/10 to-transparent" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-(--aurora-purple)/10 rounded-full blur-[150px] pointer-events-none animate-pulse-glow" />
          
          <div className="relative z-10">
            <NewsletterForm />
          </div>
        </div>
      </m.section>
    </main>
  );
}
