import { BlockData, BlockRenderer } from "@/features/cms/components/block-renderer";
import { ErrorBoundary } from "@/components/shared/error-boundary";
import {
  CategoriesSkeleton,
  ProductsSkeleton,
} from "@/features/home/components/skeletons/home-skeleton";
import { HomeWrapper } from "@/features/home/components/home-wrapper";
import { HeroSection } from "@/features/home/components/hero-section";
import { HomeContent } from "@/features/products/components/home-content";
import { productService } from "@/features/products/services/product.service";
import { Brand, Category, Product } from "@/types/models";
import { Metadata } from "next";
import { headers } from "next/headers";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Luxe | Premium Furniture Store",
  description:
    "Discover the latest trends in luxury home decor. Shop premium furniture, accessories, and more.",
};

async function getPageConfig(slug: string): Promise<any | null> {
  try {
    const headersList = await headers();
    const host = headersList.get("host") || "localhost";
    const apiUrl =
      process.env.API_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      "http://127.0.0.1:8080/api/v1";

    const res = await fetch(`${apiUrl}/pages/${slug}`, {
      headers: { "x-tenant-domain": host },
      next: { revalidate: 60 },
    });

    if (!res.ok) return null;
    const json = await res.json();
    // API returns { statusCode, message, data: {...} } - extract the data
    return json.data || json;
  } catch {
    return null;
  }
}

export const revalidate = 3600;

/**
 * =================================================================================================
 * SHOP HOME PAGE - TRANG CHỦ CỬA HÀNG (HỖ TRỢ CMS)
 * =================================================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. HYBRID RENDERING (CMS vs FALLBACK):
 *    - Hệ thống ưu tiên lấy cấu hình trang từ API Page Builder (`getPageConfig`).
 *    - Nếu có cấu hình (CMS Mode) -> Sử dụng `BlockRenderer` để vẽ giao diện động.
 *    - Nếu không có (Fallback Mode) -> Hiện giao diện mặc định đã code cứng (Static Sections).
 *
 * 2. DATA PROMISES (HYDRATION):
 *    - `dataContext` chứa các Promises (products, categories, brands).
 *    - Thay vì chờ đợi tất cả dữ liệu ở Server (gây chậm trang), ta truyền Promise xuống
 *      các Blocks. Block nào cần dữ liệu sẽ tự `use(promise)` để hiển thị khi có kết quả.
 *
 * 3. SEO & METADATA:
 *    - Cấu hình Meta tiêu chuẩn của Next.js để tối ưu tìm kiếm Google. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - High-Conversion Landing Page: Tạo ra trang chủ chuyên nghiệp, tốc độ cực nhanh nhờ kết hợp SSR và Hydration, giúp tăng tỷ lệ chốt đơn ngay từ cái nhìn đầu tiên.
 * - Flexible Marketing: Cho phép bộ phận Marketing liên tục thay đổi chiến dịch Sale (Flash Sale, New Arrivals) thông qua CMS mà không cần chờ IT can thiệp vào code.

 * =================================================================================================
 */
export default async function Home() {
  // 1. Fetch CMS Config (Blocked)
  const cmsPage = await getPageConfig("home");

  // 2. Initiate Data Fetches (Non-blocking)
  const productsPromise = productService.getFeaturedProducts(20);
  const categoriesPromise = productService.getCategories();
  const brandsPromise = productService.getBrands();

  // Context to pass to blocks for hydration
  const dataContext = {
    products: productsPromise,
    categories: categoriesPromise,
    brands: brandsPromise,
  };

  // 3. CMS Mode
  if (cmsPage && cmsPage.blocks && cmsPage.blocks.length > 0) {
    return (
      <HomeWrapper>
        <div className="flex flex-col gap-0">
          {cmsPage.blocks.map((block: BlockData) => (
            <BlockRenderer key={block.id} block={block} data={dataContext} />
          ))}
        </div>
      </HomeWrapper>
    );
  }

  // 4. Fallback Mode (Original)
  // We need to await data here if we fallback to the old component which expects generic props (or update it to accept promises too, but easier to await here for legacy compat)
  // But to preserve the "Suspense" behavior of the legacy code, we should wrap it.
  // Actually, the legacy HomeDataFetcher did the fetching.

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
  } catch {
    // Silently fail - will show empty state
  }

  return (
    <HomeContent products={products} categories={categories} brands={brands} />
  );
}
