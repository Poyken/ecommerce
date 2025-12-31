import { ErrorBoundary } from "@/components/shared/error-boundary";
import {
  CategoriesSkeleton,
  ProductsSkeleton,
} from "@/components/shared/skeletons/home-skeleton";
import { HomeWrapper } from "@/features/home/components/home-wrapper";
import { HeroSection } from "@/features/products/components/hero-section";
import { HomeContent } from "@/features/products/components/home-content";
import { productService } from "@/services/product.service";
import { Brand, Category, Product } from "@/types/models";
import { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Luxe | Premium Furniture Store",
  description:
    "Discover the latest trends in luxury home decor. Shop premium furniture, accessories, and more.",
};

/**
 * =====================================================================
 * HOME PAGE - Trang chủ
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. CHIẾN LƯỢC RENDERING: Streaming SSR với Suspense
 * - `HeroSection`: Client Component được render ngay lập tức (Tối ưu LCP).
 * - `HomeDataFetcher`: Server Component lấy dữ liệu bất đồng bộ.
 * - `Suspense`: Hiển thị skeleton trong khi đang tải dữ liệu.
 *
 * 2. TỐI ƯU HIỆU NĂNG (LCP/TTFB):
 * - Cách cũ: await Promise.all() chặn việc thực thi -> TTFB cao.
 * - Cách mới: Render khung trang + Hero trước, sau đó stream dữ liệu về sau.
 * - Kết quả: Người dùng thấy Hero ngay lập tức, cải thiện cảm giác mượt mà.
 *
 * 3. FALLBACK UI:
 * - `HomeContentSkeleton` cung cấp trạng thái loading không gây giật layout (layout shift).
 * =====================================================================
 */
export const revalidate = 3600;

export default function Home() {
  return (
    <ErrorBoundary name="HomePage">
      <HomeWrapper>
        <HeroSection />

        <Suspense fallback={<HomeContentSkeleton />}>
          <HomeDataFetcher />
        </Suspense>
      </HomeWrapper>
    </ErrorBoundary>
  );
}

// ---------------------------------------------------------------------
// SUB-COMPONENTS
// ---------------------------------------------------------------------

/**
 * Loading Skeleton khớp với layout của HomeContent
 */
function HomeContentSkeleton() {
  return (
    <div className="space-y-16 pb-16">
      <div className="container mx-auto px-4 mt-8">
        <CategoriesSkeleton />
      </div>

      {/* Brands Placeholder - Minimal height to prevent shift */}
      <div className="container mx-auto px-4 h-20 bg-foreground/5 rounded-lg animate-pulse" />

      <div className="container mx-auto px-4">
        <ProductsSkeleton count={4} />
      </div>
    </div>
  );
}

/**
 * Async Component để lấy dữ liệu riêng biệt khỏi luồng chính của trang
 */
async function HomeDataFetcher() {
  let products: Product[] = [];
  let categories: Category[] = [];
  let brands: Brand[] = [];

  try {
    // Parallel data fetching
    [products, categories, brands] = await Promise.all([
      productService.getFeaturedProducts(20),
      productService.getCategories(),
      productService.getBrands(),
    ]);
  } catch (_e) {
    // console.error("Failed to fetch home data", _e);
  }

  return (
    <HomeContent products={products} categories={categories} brands={brands} />
  );
}
