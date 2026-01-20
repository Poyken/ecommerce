import {
  BlockData,
  BlockRenderer,
} from "@/features/cms/components/block-renderer";
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
    let host = headersList.get("host") || "localhost";
    
    // In local dev, strip port if needed or handling for localhost
    if (host.includes(":")) {
      host = host.split(":")[0];
    }

    const apiUrl =
      process.env.API_URL ||
      process.env.NEXT_PUBLIC_API_URL ||
      "http://127.0.0.1:8080/api/v1";

    console.log(`[Shop] Fetching CMS config for host: ${host}, slug: ${slug}`);

    const res = await fetch(`${apiUrl}/pages/${slug}`, {
      headers: { "x-tenant-domain": host },
      next: { revalidate: 60 },
      cache: 'no-store' // Disable cache temporarily to ensure we see fresh errors
    });

    if (!res.ok) {
      console.warn(`[Shop] CMS Config not found for ${slug} on ${host} (Status: ${res.status})`);
      return null;
    }

    const json = await res.json();
    return json.data || json;
  } catch (err) {
    console.error(`[Shop] Error fetching CMS config:`, err);
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

  // 2. Initiate Data Fetches (Non-blocking) - Using Server Actions
  const { getFeaturedProductsAction, getCategoriesAction, getBrandsAction } = await import("@/features/products/actions");
  const productsPromise = getFeaturedProductsAction(20).then((res) => res.success ? res.data : []);
  const categoriesPromise = getCategoriesAction().then((res) => res.success ? res.data : []);
  const brandsPromise = getBrandsAction().then((res) => res.success ? res.data : []);

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
        <ProductsSkeleton count={8} />
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
    // Parallel data fetching - Using Server Actions
    const { getFeaturedProductsAction, getCategoriesAction, getBrandsAction } = await import("@/features/products/actions");
    const [productsRes, categoriesRes, brandsRes] = await Promise.all([
      getFeaturedProductsAction(20),
      getCategoriesAction(),
      getBrandsAction(),
    ]);
    products = (productsRes.success && productsRes.data ? productsRes.data : []) as Product[];
    categories = (categoriesRes.success && categoriesRes.data ? categoriesRes.data : []) as Category[];
    brands = (brandsRes.success && brandsRes.data ? brandsRes.data : []) as Brand[];
  } catch {
    // Silently fail - will show empty state
  }

  return (
    <HomeContent products={products} categories={categories} brands={brands} />
  );
}
