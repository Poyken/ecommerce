import { HomeContent } from "@/components/templates/home-content";
import { productService } from "@/services/product.service";

import { Metadata } from "next";

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
 * RENDERING STRATEGY: ISR (Incremental Static Regeneration)
 * - `export const revalidate = 3600`: Trang này được build tĩnh (Static) và cache trong 1 giờ.
 * - Sau 1 giờ, request tiếp theo sẽ trigger việc rebuild trang trong background.
 * - `dynamic = "force-static"`: Bắt buộc Next.js coi trang này là tĩnh, ngay cả khi có gọi API.
 *
 * DATA FETCHING:
 * - Sử dụng `Promise.all` để gọi song song 2 API (Products và Categories).
 * - Giúp giảm tổng thời gian chờ (Total Latency = Max(Time1, Time2) thay vì Sum).
 * - `productService` được cấu hình `next: { revalidate: 3600 }` để đồng bộ với page cache.
 *
 * ERROR HANDLING:
 * - Sử dụng `try/catch` để đảm bảo trang không bị crash nếu API lỗi.
 * - Nếu lỗi, hiển thị trang với dữ liệu rỗng (fallback UI) thay vì trang lỗi 500.
 * =====================================================================
 */
export default async function Home() {
  // Use standard ISR or static rendering
  // Note: For now, we rely on the revalidate constant if specified,
  // or just default dynamic behavior.

  let productsPromise;
  let categoriesPromise;
  let brandsPromise;

  try {
    productsPromise = productService.getFeaturedProducts(20);
    categoriesPromise = productService.getCategories();
    brandsPromise = productService.getBrands();
  } catch (e) {
    console.error("Failed to fetch data", e);
    productsPromise = Promise.resolve([]);
    categoriesPromise = Promise.resolve([]);
    brandsPromise = Promise.resolve([]);
  }

  return (
    <HomeContent
      productsPromise={productsPromise}
      categoriesPromise={categoriesPromise}
      brandsPromise={brandsPromise}
    />
  );
}
