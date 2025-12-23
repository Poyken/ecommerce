import { ShopContent } from "@/components/templates/shop-content";
import { http } from "@/lib/http";
import { productService } from "@/services/product.service";
import { getTranslations } from "next-intl/server";

// Types based on API response
import { ApiResponse } from "@/types/dtos";
import { Brand, Product } from "@/types/models";
import { Metadata } from "next";

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
 * - Dữ liệu phân trang được lấy từ `productsRes.meta` và truyền xuống Client để hiển thị thanh phân trang.
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
      const [categories, brandsRes] = await Promise.all([
        productService.getCategories(),
        http<ApiResponse<Brand[]>>("/brands", { skipAuth: true }),
      ]);

      if (categoryId) {
        const category = categories.find(
          (c: any) => c.id === categoryId || c.name === categoryId
        );
        if (category) title = `${category.name} | Luxe`;
      } else if (brandId) {
        const brand = brandsRes.data?.find(
          (b: any) => b.id === brandId || b.name === brandId
        );
        if (brand) title = `${brand.name} | Luxe`;
      }
    } catch (e) {
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
    // These can be cached as they don't change per request
    const getCachedCategories = async () => {
      "use cache";
      return productService.getCategories();
    };

    const getCachedBrands = async () => {
      "use cache";
      const res = await http<ApiResponse<Brand[]>>("/brands", {
        skipAuth: true,
      });
      return res.data || [];
    };

    const productsPromise = productService.getProducts({
      categoryId,
      brandId,
      search: searchQuery,
      page: params.page ? Number(params.page) : 1,
      limit: 12,
      sort: typeof params.sort === "string" ? params.sort : undefined,
    });

    const categoriesPromise = getCachedCategories();
    const brandsPromise = getCachedBrands();
    const suggestedProductsPromise = productService.getFeaturedProducts(4);

    // Fetch wishlist items (server-side) to ensure correct initial state
    const { getWishlistAction } = await import("@/actions/wishlist");
    let wishlistItems: Product[] = [];
    try {
      const items = await getWishlistAction();
      if (items) {
        wishlistItems = items;
      }
    } catch (error) {
      console.error("Failed to fetch wishlist", error);
    }

    return (
      <ShopContent
        productsPromise={productsPromise}
        categoriesPromise={categoriesPromise}
        brandsPromise={brandsPromise}
        suggestedProductsPromise={suggestedProductsPromise}
        wishlistItems={wishlistItems}
      />
    );
  } catch (e) {
    console.error("Failed to fetch data", e);
    const t = await getTranslations("shop");
    return <div>{t("errorLoading")}</div>;
  }
}
