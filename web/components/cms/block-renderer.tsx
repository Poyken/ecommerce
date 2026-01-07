"use client";

/**
 * =====================================================================
 * BLOCK RENDERER - RENDER ĐỘNG CÁC BLOCK CMS
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * Đây là CORE của hệ thống Page Builder. Component này nhận mô tả block
 * dạng JSON và render ra React component tương ứng.
 *
 * 1. KIẾN TRÚC:
 *    - PARAM_MAP: Object mapping "type" (string) -> React Component
 *    - BlockData: { id, type, props } - Mô tả 1 block
 *    - BlockRenderer: Nhận BlockData -> Tìm Component trong PARAM_MAP -> Render
 *
 * 2. DYNAMIC IMPORT (Code Splitting):
 *    - Mỗi block type được load động (dynamic import)
 *    - Chỉ tải code khi block thực sự được sử dụng
 *    - Giảm bundle size ban đầu của trang
 *
 * 3. CÁC BLOCK TYPES HỖ TRỢ:
 *    - Hero: Banner chính trang chủ
 *    - Features: Danh sách tính năng
 *    - Categories/Brands/Products: Hiển thị data từ API
 *    - CTASection: Call-to-action
 *    - FAQ/Testimonials/Newsletter: Các section thông dụng
 *    - Header/Footer: Ẩn global header/footer khi có custom
 *
 * 4. LAYOUT VISIBILITY:
 *    - Nếu page có block Header/Footer custom
 *    - Tự động ẩn global Header/Footer qua LayoutVisibilityProvider
 *
 * 5. SUSPENSE + SKELETON:
 *    - Mỗi block có Skeleton riêng hiển thị khi đang load
 *    - UX mượt mà, không bị layout shift
 * =====================================================================
 */

import {
  BrandsSkeleton,
  CategoriesSkeleton,
  ProductsSkeleton,
} from "@/components/shared/skeletons/home-skeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { useLayoutVisibility } from "@/features/layout/providers/layout-visibility-provider";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";
import { Suspense, useEffect } from "react";

const BlockSkeleton = () => (
  <div className="w-full py-20 px-4 animate-pulse bg-muted/5 rounded-2xl border border-dashed border-border/50">
    <div className="max-w-4xl mx-auto space-y-6">
      <Skeleton className="h-4 w-24 mx-auto rounded-full" />
      <Skeleton className="h-12 w-3/4 mx-auto" />
      <Skeleton className="h-4 w-1/2 mx-auto" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 pt-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="aspect-square w-full rounded-xl" />
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/3" />
          </div>
        ))}
      </div>
    </div>
  </div>
);

// Dynamic Maps: Key = JSON "type" -> Value = React Component
export const PARAM_MAP = {
  Hero: dynamic(
    () =>
      import("@/features/home/components/hero-section").then(
        (mod) => mod.HeroSection
      ),
    { loading: () => <BlockSkeleton /> }
  ),
  Features: dynamic(
    () =>
      import("@/features/home/components/features-section").then(
        (mod) => mod.FeaturesSection
      ),
    { loading: () => <BlockSkeleton /> }
  ),
  Banner: dynamic(
    () =>
      import("@/features/home/components/banner-section").then(
        (mod) => mod.BannerSection
      ),
    { loading: () => <BlockSkeleton /> }
  ),
  TextBlock: dynamic(
    () =>
      import("@/features/home/components/text-block-section").then(
        (mod) => mod.TextBlockSection
      ),
    { loading: () => <BlockSkeleton /> }
  ),
  CTASection: dynamic(
    () =>
      import("@/features/home/components/cta-section").then(
        (mod) => mod.CTASection
      ),
    { loading: () => <BlockSkeleton /> }
  ),
  Categories: dynamic(
    () =>
      import("@/features/home/components/categories-block").then(
        (mod) => mod.CategoriesBlock
      ),
    {
      loading: () => (
        <div className="container mx-auto px-4 py-12">
          <CategoriesSkeleton />
        </div>
      ),
    }
  ),
  Brands: dynamic(
    () =>
      import("@/features/home/components/brands-block").then(
        (mod) => mod.BrandsBlock
      ),
    {
      loading: () => (
        <div className="container mx-auto px-4 py-12">
          <BrandsSkeleton />
        </div>
      ),
    }
  ),
  Products: dynamic(
    () =>
      import("@/features/home/components/products-block").then(
        (mod) => mod.ProductsBlock
      ),
    {
      loading: () => (
        <div className="container mx-auto px-4 py-12">
          <ProductsSkeleton count={4} />
        </div>
      ),
    }
  ),
  Deal: dynamic(
    () =>
      import("@/features/home/components/deal-block").then(
        (mod) => mod.DealBlock
      ),
    { loading: () => <BlockSkeleton /> }
  ),
  Stats: dynamic(
    () =>
      import("@/features/home/components/stats-block").then(
        (mod) => mod.StatsBlock
      ),
    { loading: () => <div className="h-32 w-full bg-muted/10 animate-pulse" /> }
  ),
  PromoGrid: dynamic(
    () =>
      import("@/features/home/components/promo-grid-block").then(
        (mod) => mod.PromoGridBlock
      ),
    { loading: () => <BlockSkeleton /> }
  ),
  Testimonials: dynamic(
    () =>
      import("@/features/home/components/testimonials-block").then(
        (mod) => mod.TestimonialsBlock
      ),
    { loading: () => <BlockSkeleton /> }
  ),
  FAQ: dynamic(
    () =>
      import("@/features/home/components/faq-block").then(
        (mod) => mod.FAQBlock
      ),
    { loading: () => <BlockSkeleton /> }
  ),
  Newsletter: dynamic(
    () =>
      import("@/features/home/components/newsletter-block").then(
        (mod) => mod.NewsletterBlock
      ),
    { loading: () => <div className="h-64 w-full bg-muted/10 animate-pulse" /> }
  ),
  Pricing: dynamic(
    () =>
      import("@/features/home/components/pricing-block").then(
        (mod) => mod.PricingBlock
      ),
    { loading: () => <BlockSkeleton /> }
  ),
  Gallery: dynamic(
    () =>
      import("@/features/home/components/gallery-block").then(
        (mod) => mod.GalleryBlock
      ),
    { loading: () => <BlockSkeleton /> }
  ),
  Marquee: dynamic(
    () =>
      import("@/features/home/components/marquee-block").then(
        (mod) => mod.MarqueeBlock
      ),
    { loading: () => <div className="h-24 w-full bg-muted/5 animate-pulse" /> }
  ),
  Countdown: dynamic(
    () =>
      import("@/features/home/components/countdown-block").then(
        (mod) => mod.CountdownBlock
      ),
    { loading: () => <BlockSkeleton /> }
  ),
  Header: dynamic(
    () =>
      import("@/features/home/components/header-block").then(
        (mod) => mod.HeaderBlock
      ),
    {
      loading: () => (
        <div className="h-20 bg-muted/20 animate-pulse border-b" />
      ),
    }
  ),
  Footer: dynamic(
    () =>
      import("@/features/home/components/footer-block").then(
        (mod) => mod.FooterBlock
      ),
    { loading: () => <div className="h-64 bg-muted/20 animate-pulse" /> }
  ),
  FlexLayout: dynamic(
    () =>
      import("@/features/home/components/flex-layout-block").then(
        (mod) => mod.FlexLayoutBlock
      ),
    { loading: () => <BlockSkeleton /> }
  ),
  VideoHero: dynamic(
    () =>
      import("@/features/home/components/video-hero-block").then(
        (mod) => mod.VideoHeroBlock
      ),
    { loading: () => <BlockSkeleton /> }
  ),
};

export type BlockData = {
  id: string; // unique block id
  type: keyof typeof PARAM_MAP;
  props: Record<string, any>;
};

export const BlockRenderer = ({
  block,
  data,
}: {
  block: BlockData;
  data?: any;
}) => {
  const Component = PARAM_MAP[block.type];
  const { setHideHeader, setHideFooter } = useLayoutVisibility();

  // Side effect to hide global elements if this block is a Header or Footer
  useEffect(() => {
    if (block.type === "Header") setHideHeader(true);
    if (block.type === "Footer") setHideFooter(true);
  }, [block.type, setHideHeader, setHideFooter]);

  if (!Component) {
    console.warn(`Block type "${block.type}" not found in PARAM_MAP`);
    return null;
  }

  const { styles } = (block.props as any) || {};

  const wrapperStyle = {
    paddingTop: styles?.paddingTop,
    paddingBottom: styles?.paddingBottom,
    marginTop: styles?.marginTop,
    marginBottom: styles?.marginBottom,
    borderRadius: styles?.borderRadius,
    backgroundColor: styles?.backgroundColor,
    color: styles?.textColor,
  };

  return (
    <div
      style={wrapperStyle}
      className={cn(styles?.animation && `animate-${styles.animation}`)}
    >
      <Suspense fallback={<BlockSkeleton />}>
        <Component {...(block.props as any)} data={data} />
      </Suspense>
    </div>
  );
};
