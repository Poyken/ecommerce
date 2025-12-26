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
 * 1. RENDERING STRATEGY: ISR (Incremental Static Regeneration)
 * - `export const revalidate = 3600`: Trang này được build tĩnh (Static) và cache trong 1 giờ.
 * - Sau 1 giờ, request tiếp theo sẽ trigger việc rebuild trang trong background.
 * - `dynamic = "force-static"`: Bắt buộc Next.js coi trang này là tĩnh, ngay cả khi có gọi API.
 *
 * 2. DATA FETCHING:
 * - Sử dụng `Promise.all` để gọi song song 3 API (Products, Categories, Brands).
 * - Giúp giảm tổng thời gian chờ (Total Latency = Max(Time1, Time2, Time3) thay vì Sum).
 *
 * 3. ERROR HANDLING:
 * - Sử dụng `try/catch` để đảm bảo trang không bị crash nếu API lỗi (fallback empty array).
 * - Nếu lỗi, hiển thị trang với dữ liệu rỗng (fallback UI) thay vì trang lỗi 500.
 * =====================================================================
 */
export default async function Home() {
  // Await all data in parallel at the server component level
  // This prevents blocking waterfalls when client components use the use() hook
  let products: Product[] = [];
  let categories: Category[] = [];
  let brands: Brand[] = [];

  try {
    [products, categories, brands] = await Promise.all([
      productService.getFeaturedProducts(20),
      productService.getCategories(),
      productService.getBrands(),
    ]);
  } catch (e) {
    // console.error("Failed to fetch data", e);
  }

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HomeContent
        products={products}
        categories={categories}
        brands={brands}
      />
    </Suspense>
  );
}
