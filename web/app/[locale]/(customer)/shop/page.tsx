import { ShopContent } from "@/features/products/components/shop-content";
import { getTranslations } from "next-intl/server";

// Types based on API response
import { Product } from "@/types/models";
import { Metadata } from "next";



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
      const { getCategoriesAction, getBrandsAction } = await import("@/features/products/actions");
      const [categoriesRes, brandsRes] = await Promise.all([
        getCategoriesAction(),
        getBrandsAction(),
      ]);
      const categories = categoriesRes.success ? categoriesRes.data : [];
      const brands = brandsRes.success ? brandsRes.data : [];

      if (categoryId) {
        const category = (categories as any[]).find(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (c: any) => c.id === categoryId || c.name === categoryId
        );
        if (category) title = `${category.name} | Luxe`;
      } else if (brandId) {
        const brand = (brands as any[]).find(
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
    // Use server actions for all data fetching
    const { getProductsAction, getCategoriesAction, getBrandsAction, getFeaturedProductsAction } = await import("@/features/products/actions");
    
    const productsPromise = getProductsAction({
      categoryId,
      brandId,
      search: searchQuery,
      page: params.page ? Number(params.page) : 1,
      limit: 20,
      sort: typeof params.sort === "string" ? params.sort : undefined,
      includeSkus: "true",
    }).then((res) => ({
      data: res.success && Array.isArray(res.data) ? (res.data as Product[]) : [],
      meta: res.success && res.meta ? res.meta : { page: 1, limit: 20, total: 0, lastPage: 1 },
    }));

    const categoriesPromise = getCategoriesAction().then((res) => 
      (res.success && res.data ? res.data : []) as import("@/types/models").Category[]
    );
    const brandsPromise = getBrandsAction().then((res) => 
      (res.success && res.data ? res.data : []) as import("@/types/models").Brand[]
    );
    const suggestedProductsPromise = getFeaturedProductsAction({ limit: 4 }).then((res) =>
      (res.success && res.data ? res.data : []) as import("@/types/models").Product[]
    );

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
