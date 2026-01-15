import { ShopContent } from "@/features/products/components/shop-content";
import { getTranslations } from "next-intl/server";

// Types based on API response
import { Product } from "@/types/models";
import { Metadata } from "next";
import { productService } from "@/features/products/services/product.service";

/**
 * =====================================================================
 * SHOP PAGE - Trang danh sách sản phẩm (Cửa hàng)
 * =====================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. SEARCH PARAMS (URL State):
 * - Nhận các tham số từ URL như `categoryId`, `brandId`, `search`, `page`, `sort`.
 * - Đây là cách chính để đồng bộ trạng thái lọc/tìm kiếm giữa URL và Server.
 *
 * 2. PARALLEL FETCHING:
 * - Sử dụng `Promise.all` để fetch đồng thời: Products, Categories, Brands, và Suggested Products.
 * - Tối ưu hóa hiệu năng bằng cách không bắt các request phải chờ đợi nhau.
 *
 * 3. PAGINATION:
 * - Dữ liệu phân trang được lấy từ `productsRes.meta` và truyền xuống Client để hiển thị thanh phân trang. *
 * 🎯 ỨNG DỤNG THỰC TẾ (APPLICATION):
 * - Dynamic Catalog Browsing: Mang lại trải nghiệm tìm kiếm sản phẩm mượt mà với bộ lọc đa dạng (Category, Brand, Price), giúp khách hàng nhanh chóng tìm thấy món đồ ưng ý giữa hàng nghìn sản phẩm.
 * - Search-Optimized Discovery: Tự động cập nhật Metadata theo từ khóa tìm kiếm và danh mục, giúp các trang kết quả lọc dễ dàng được lập chỉ mục (index) và xếp hạng cao trên Google.

 * =====================================================================
 */

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}): Promise<Metadata> {
  const params = await searchParams;
  const categoryId =
    typeof params.categoryId === "string" ? params.categoryId : undefined;
  const brandId =
    typeof params.brandId === "string" ? params.brandId : undefined;
  const searchQuery =
    typeof params.search === "string" ? params.search : undefined;

  const t = await getTranslations("shop");
  let title = `${t("title")} | Luxe`;
  const description = t("metaDescription");

  if (searchQuery) {
    title = `${t("searchResults", { query: searchQuery })} | Luxe`;
  } else if (categoryId || brandId) {
    try {
      const [categories, brands] = await Promise.all([
        productService.getCategories(),
        productService.getBrands(),
      ]);

      if (categoryId) {
        const category = categories.find(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (c: any) => c.id === categoryId || c.name === categoryId
        );
        if (category) title = `${category.name} | Luxe`;
      } else if (brandId) {
        const brand = brands.find(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (b: any) => b.id === brandId || b.name === brandId
        );
        if (brand) title = `${brand.name} | Luxe`;
      }
    } catch (_e) {
      if (categoryId) title = `${categoryId} | Luxe`;
      else if (brandId) title = `${brandId} | Luxe`;
    }
  }

  return {
    title,
    description,
    openGraph: {
      title,
      description,
    },
  };
}

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const categoryId =
    typeof params.categoryId === "string" ? params.categoryId : undefined;
  const brandId =
    typeof params.brandId === "string" ? params.brandId : undefined;
  const searchQuery =
    typeof params.search === "string" ? params.search : undefined;

  try {
    const productsPromise = productService
      .getProducts({
        categoryId,
        brandId,
        search: searchQuery,
        page: params.page ? Number(params.page) : 1,
        limit: 20,
        sort: typeof params.sort === "string" ? params.sort : undefined,
        includeSkus: "true",
      })
      .then((res) => ({
        data: res.data || [],
        meta: res.meta || { page: 1, limit: 20, total: 0, lastPage: 1 },
      }));

    const categoriesPromise = productService.getCategories();
    const brandsPromise = productService.getBrands();
    const suggestedProductsPromise = productService.getFeaturedProducts(4);

    // Fetch wishlist items (server-side) to ensure correct initial state
    const { getWishlistAction } = await import("@/features/wishlist/actions");
    let wishlistItems: Product[] = [];
    try {
      const result = await getWishlistAction();
      if (result.success && result.data) {
        wishlistItems = result.data;
      }
    } catch (_error) {}

    return (
      <ShopContent
        productsPromise={productsPromise}
        categoriesPromise={categoriesPromise}
        brandsPromise={brandsPromise}
        suggestedProductsPromise={suggestedProductsPromise}
        wishlistItems={wishlistItems}
      />
    );
  } catch (_e) {
    const t = await getTranslations("shop");
    return <div>{t("errorLoading")}</div>;
  }
}
