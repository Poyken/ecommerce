import { ProductGridView } from "@/features/products/components/product-grid-view";
import { Link } from "@/i18n/routing";
import { productService } from "@/services/product.service";
import { getTranslations } from "next-intl/server";

/**
 * =====================================================================
 * BRAND PRODUCTS PAGE - Trang sản phẩm theo thương hiệu với ProductCard
 * =====================================================================
 */

export async function generateStaticParams() {
  try {
    const ids = await productService.getBrandIds();
    if (ids.length === 0) {
      return [{ id: "fallback" }];
    }
    return ids.map((id) => ({ id }));
  } catch (error) {
    console.warn("Failed to generate brand static params:", error);
    return [{ id: "fallback" }];
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const products = await productService.getProducts({
    brandId: id,
    limit: 1,
  });

  const brandName = products?.data?.[0]?.brand?.name || "Brand";

  return {
    title: `${brandName} | Luxe`,
    description: `Explore all products from ${brandName}.`,
  };
}

/**
 * =================================================================================================
 * BRAND DETAIL PAGE - DANH SÁCH SẢN PHẨM THEO THƯƠNG HIỆU
 * =================================================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. DYNAMIC ROUTING & PARAMS:
 *    - Trang này sử dụng `[id]` để xác định thương hiệu nào đang được xem.
 *    - `generateStaticParams`: Giúp Next.js build trước (pre-render) các trang thương hiệu
 *      phổ biến để tăng tốc độ tải trang cho người dùng.
 *
 * 2. SHARED UI COMPONENTS:
 *    - Tái sử dụng `ProductGridView` để hiển thị sản phẩm và phân trang.
 *    - `t("productsFound", { count: ... })`: Sử dụng biến truyền vào i18n để hiển thị đúng số lượng.
 *
 * 3. FALLBACK UI:
 *    - Hiển thị màn hình "No Products Found" chuyên nghiệp khi một thương hiệu mới chưa có sản phẩm.
 * =================================================================================================
 */
export default async function BrandProductsPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const page = Number(resolvedSearchParams.page) || 1;
  const limit = 12;

  const [productsResponse, t] = await Promise.all([
    productService.getProducts({
      brandId: id,
      limit,
      page,
    }),
    getTranslations("common"),
  ]);

  const productsData = productsResponse?.data || [];
  const productsMeta = productsResponse?.meta || {
    total: productsData.length,
    page: 1,
    limit,
    lastPage: 1,
  };

  const brandName = productsData?.[0]?.brand?.name || "Brand";

  return (
    <div className="min-h-screen bg-background pt-24 pb-16">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-10">
          <Link
            href="/brands"
            className="text-accent hover:underline mb-4 inline-flex items-center gap-2 text-sm font-medium"
          >
            ← {t("backToBrands")}
          </Link>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mt-4">
            <div>
              <span className="text-accent font-black uppercase tracking-[0.3em] text-[10px]">
                {t("luxuryPartners")}
              </span>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tighter mt-1">
                {brandName}
              </h1>
            </div>
            <p className="text-muted-foreground text-lg">
              {t("productsFound", { count: productsMeta.total })}
            </p>
          </div>
          <div className="w-24 h-1 bg-accent/40 rounded-full mt-4" />
        </div>

        {/* Products Grid */}
        {productsData.length > 0 ? (
          <ProductGridView products={productsData} pagination={productsMeta} />
        ) : (
          <div className="text-center py-24 px-4 bg-muted/30 rounded-3xl border border-border/50">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📦</span>
            </div>
            <h3 className="text-xl font-bold mb-2">{t("noProductsFound")}</h3>
            <p className="text-muted-foreground">{t("noProductsFoundDesc")}</p>
            <Link
              href="/shop"
              className="text-accent hover:underline mt-4 inline-block font-medium"
            >
              {t("browseAllProducts")} →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
