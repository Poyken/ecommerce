"use client";



import {
  BrandsSkeleton,
  CategoriesSkeleton,
  ProductsSkeleton,
} from "@/features/home/components/skeletons/home-skeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { useLayoutVisibility } from "@/features/layout/providers/layout-visibility-provider";
import { cn } from "@/lib/utils";
import dynamic from "next/dynamic";
import { Suspense, useEffect } from "react";
import type { CSSProperties } from "react";

// =====================================================================
// TYPE DEFINITIONS FOR CMS BLOCKS
// =====================================================================

export interface BlockStyles {
  paddingTop?: string;
  paddingBottom?: string;
  paddingLeft?: string;
  paddingRight?: string;
  marginTop?: string;
  marginBottom?: string;
  marginLeft?: string;
  marginRight?: string;
  padding?: {
    top?: string;
    bottom?: string;
    left?: string;
    right?: string;
  };
  margin?: {
    top?: string;
    bottom?: string;
  };
  width?: string;
  maxWidth?: string;
  height?: string;
  minHeight?: string;
  borderRadius?: string;
  borderWidth?: string;
  borderStyle?: string;
  borderColor?: string;
  boxShadow?: string;
  opacity?: number;
  overflow?: string;
  position?: CSSProperties["position"];
  zIndex?: number;
  backgroundColor?: string;
  textColor?: string;
  display?: string;
  flexDirection?: CSSProperties["flexDirection"];
  justifyContent?: string;
  alignItems?: string;
  flexWrap?: CSSProperties["flexWrap"];
  gap?: string;
  customClasses?: string;
  animation?: string;
  auroraPreset?: string;
  glassPreset?: string;
  glowIntensity?: string;
  hoverEffect?: string;
  animationDuration?: string;
  animationDelay?: string;
}

export interface BlockAnimation {
  type?: string;
}

export interface BlockVisibility {
  desktop?: boolean;
  tablet?: boolean;
  mobile?: boolean;
}

export interface GenericBlockProps {
  styles?: BlockStyles;
  visibility?: BlockVisibility;
  animation?: BlockAnimation;
  [key: string]: any;
}

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

const SmallBlockSkeleton = () => (
  <div className="h-32 w-full bg-muted/10 animate-pulse" />
);

// =====================================================================
// DYNAMIC MAPS: Key = JSON "type" -> Value = React Component
// =====================================================================

export const PARAM_MAP = {
  // =====================================================================
  // LAYOUT BLOCKS
  // =====================================================================
  FlexLayout: dynamic(
    () =>
      import("@/features/home/components/flex-layout-block").then(
        (mod) => mod.FlexLayoutBlock
      ),
    { loading: () => <BlockSkeleton /> }
  ),
  Divider: dynamic(
    () =>
      import("@/features/home/components/divider-block").then(
        (mod) => mod.DividerBlock
      ),
    { loading: () => <SmallBlockSkeleton /> }
  ),
  Tabs: dynamic(
    () =>
      import("@/features/home/components/tabs-block").then(
        (mod) => mod.TabsBlock
      ),
    { loading: () => <BlockSkeleton /> }
  ),
  Accordion: dynamic(
    () =>
      import("@/features/home/components/accordion-block").then(
        (mod) => mod.AccordionBlock
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

  // =====================================================================
  // HERO & MEDIA BLOCKS
  // =====================================================================
  Hero: dynamic(
    () =>
      import("@/features/home/components/hero-section").then(
        (mod) => mod.HeroSection
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
  Banner: dynamic(
    () =>
      import("@/features/home/components/banner-section").then(
        (mod) => mod.BannerSection
      ),
    { loading: () => <BlockSkeleton /> }
  ),
  PromoBanner: dynamic(
    () =>
      import("@/features/home/components/promo-banner-block").then(
        (mod) => mod.PromoBannerBlock
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
  PromoGrid: dynamic(
    () =>
      import("@/features/home/components/promo-grid-block").then(
        (mod) => mod.PromoGridBlock
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

  // =====================================================================
  // CONTENT BLOCKS
  // =====================================================================
  TextBlock: dynamic(
    () =>
      import("@/features/home/components/text-block-section").then(
        (mod) => mod.TextBlockSection
      ),
    { loading: () => <BlockSkeleton /> }
  ),
  ImageText: dynamic(
    () =>
      import("@/features/home/components/image-text-block").then(
        (mod) => mod.ImageTextBlock
      ),
    { loading: () => <BlockSkeleton /> }
  ),
  Team: dynamic(
    () =>
      import("@/features/home/components/team-block").then(
        (mod) => mod.TeamBlock
      ),
    { loading: () => <BlockSkeleton /> }
  ),
  Timeline: dynamic(
    () =>
      import("@/features/home/components/timeline-block").then(
        (mod) => mod.TimelineBlock
      ),
    { loading: () => <BlockSkeleton /> }
  ),
  Steps: dynamic(
    () =>
      import("@/features/home/components/steps-block").then(
        (mod) => mod.StepsBlock
      ),
    { loading: () => <BlockSkeleton /> }
  ),
  IconGrid: dynamic(
    () =>
      import("@/features/home/components/icon-grid-block").then(
        (mod) => mod.IconGridBlock
      ),
    { loading: () => <BlockSkeleton /> }
  ),

  // =====================================================================
  // COMMERCE BLOCKS
  // =====================================================================
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
  FeaturedCollection: dynamic(
    () =>
      import("@/features/home/components/featured-collection-block").then(
        (mod) => mod.FeaturedCollectionBlock
      ),
    { loading: () => <BlockSkeleton /> }
  ),
  Deal: dynamic(
    () =>
      import("@/features/home/components/deal-block").then(
        (mod) => mod.DealBlock
      ),
    { loading: () => <BlockSkeleton /> }
  ),
  Pricing: dynamic(
    () =>
      import("@/features/home/components/pricing-block").then(
        (mod) => mod.PricingBlock
      ),
    { loading: () => <BlockSkeleton /> }
  ),
  Comparison: dynamic(
    () =>
      import("@/features/home/components/comparison-block").then(
        (mod) => mod.ComparisonBlock
      ),
    { loading: () => <BlockSkeleton /> }
  ),
  Countdown: dynamic(
    () =>
      import("@/features/home/components/countdown-block").then(
        (mod) => mod.CountdownBlock
      ),
    { loading: () => <BlockSkeleton /> }
  ),
  LogoWall: dynamic(
    () =>
      import("@/features/home/components/logo-wall-block").then(
        (mod) => mod.LogoWallBlock
      ),
    { loading: () => <BlockSkeleton /> }
  ),

  // =====================================================================
  // ENGAGEMENT BLOCKS
  // =====================================================================
  Newsletter: dynamic(
    () =>
      import("@/features/home/components/newsletter-block").then(
        (mod) => mod.NewsletterBlock
      ),
    { loading: () => <div className="h-64 w-full bg-muted/10 animate-pulse" /> }
  ),
  FAQ: dynamic(
    () =>
      import("@/features/home/components/faq-block").then(
        (mod) => mod.FAQBlock
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
  ContactForm: dynamic(
    () =>
      import("@/features/home/components/contact-form-block").then(
        (mod) => mod.ContactFormBlock
      ),
    { loading: () => <BlockSkeleton /> }
  ),
  Blog: dynamic(
    () =>
      import("@/features/home/components/blog-block").then(
        (mod) => mod.BlogBlock
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
  Features: dynamic(
    () =>
      import("@/features/home/components/features-section").then(
        (mod) => mod.FeaturesSection
      ),
    { loading: () => <BlockSkeleton /> }
  ),
  Stats: dynamic(
    () =>
      import("@/features/home/components/stats-block").then(
        (mod) => mod.StatsBlock
      ),
    { loading: () => <SmallBlockSkeleton /> }
  ),

  // =====================================================================
  // ADVANCED BLOCKS
  // =====================================================================
  Map: dynamic(
    () =>
      import("@/features/home/components/map-block").then(
        (mod) => mod.MapBlock
      ),
    { loading: () => <BlockSkeleton /> }
  ),
  Embed: dynamic(
    () =>
      import("@/features/home/components/embed-block").then(
        (mod) => mod.EmbedBlock
      ),
    { loading: () => <BlockSkeleton /> }
  ),
  SocialFeed: dynamic(
    () =>
      import("@/features/home/components/social-feed-block").then(
        (mod) => mod.SocialFeedBlock
      ),
    { loading: () => <SmallBlockSkeleton /> }
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

  const { styles, visibility, animation } = (block.props as GenericBlockProps) || {};

  // Check visibility
  if (visibility) {
    // Note: In a real implementation, you'd check device type and user state
    // For now, we just render based on the visibility settings
  }

  const wrapperStyle: CSSProperties = {
    paddingTop: styles?.paddingTop || styles?.padding?.top,
    paddingBottom: styles?.paddingBottom || styles?.padding?.bottom,
    paddingLeft: styles?.paddingLeft || styles?.padding?.left,
    paddingRight: styles?.paddingRight || styles?.padding?.right,
    marginTop: styles?.marginTop || styles?.margin?.top,
    marginBottom: styles?.marginBottom || styles?.margin?.bottom,
    marginLeft: styles?.marginLeft,
    marginRight: styles?.marginRight,
    width: styles?.width,
    maxWidth: styles?.maxWidth,
    height: styles?.height,
    minHeight: styles?.minHeight,
    borderRadius: styles?.borderRadius,
    borderWidth: styles?.borderWidth,
    borderStyle: styles?.borderStyle,
    borderColor: styles?.borderColor,
    boxShadow: styles?.boxShadow,
    opacity: styles?.opacity,
    overflow: styles?.overflow as CSSProperties["overflow"],
    position: styles?.position,
    zIndex: styles?.zIndex,
    backgroundColor: styles?.backgroundColor,
    color: styles?.textColor,
    display: styles?.display as CSSProperties["display"],
    flexDirection: styles?.flexDirection,
    justifyContent: styles?.justifyContent,
    alignItems: styles?.alignItems,
    flexWrap: styles?.flexWrap,
    gap: styles?.gap,
  };

  // Animation classes
  const animationClass =
    animation?.type && animation.type !== "none"
      ? `animate-${animation.type}`
      : "";

  return (
    <div
      style={{
        ...wrapperStyle,
        ["--glow-opacity" as any]: styles?.glowIntensity ? Number(styles.glowIntensity) / 100 : 0,
        animationDuration: styles?.animationDuration ? `${styles.animationDuration}s` : undefined,
        animationDelay: styles?.animationDelay ? `${styles.animationDelay}s` : undefined,
        transitionDuration: styles?.hoverEffect && styles.hoverEffect !== "none" ? "300ms" : undefined,
      }}
      className={cn(
        styles?.customClasses,
        animationClass,
        styles?.animation && `animate-${styles.animation}`,
        // Aurora Presets
        styles?.auroraPreset === "blue" && "bg-blue-500/5 shadow-[0_0_100px_-20px_rgba(59,130,246,0.3)]",
        styles?.auroraPreset === "purple" && "bg-purple-500/5 shadow-[0_0_100px_-20px_rgba(168,85,247,0.3)]",
        styles?.auroraPreset === "orange" && "bg-orange-500/5 shadow-[0_0_100px_-20px_rgba(249,115,22,0.3)]",
        styles?.auroraPreset === "cinematic" && "bg-gradient-to-br from-blue-500/5 to-purple-500/5 shadow-[0_0_100px_-20px_rgba(59,130,246,0.3),0_0_100px_-20px_rgba(168,85,247,0.3)]",
        // Glass Presets
        styles?.glassPreset === "frosted" && "glass backdrop-blur-md border border-white/10",
        styles?.glassPreset === "premium" && "glass-premium backdrop-blur-2xl border border-white/20 shadow-2xl",
        // Glow Effect
        styles?.glowIntensity && Number(styles.glowIntensity) > 0 && "after:absolute after:inset-0 after:rounded-[inherit] after:shadow-[0_0_20px_0_rgba(255,255,255,0.1)] after:opacity-50 after:pointer-events-none",
        // Hover Effects
        styles?.hoverEffect === "lift" && "hover:-translate-y-2 hover:shadow-2xl",
        styles?.hoverEffect === "scale" && "hover:scale-105",
        styles?.hoverEffect === "glow" && "hover:shadow-[0_0_30px_rgba(59,130,246,0.4)]",
        styles?.hoverEffect === "shine" && "relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/10 before:to-transparent before:-translate-x-full hover:before:animate-shine"
      )}
    >
      <Suspense fallback={<BlockSkeleton />}>
        <Component {...(block.props as any)} data={data} />
      </Suspense>
    </div>
  );
};
