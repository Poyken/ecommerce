import { ProductCard } from "@/features/products/components/product-card";
import { Link } from "@/i18n/routing";
import { productService } from "@/services/product.service";
import { getTranslations } from "next-intl/server";

/**
 * =====================================================================
 * CATEGORY PRODUCTS PAGE - Trang sản phẩm theo danh mục với ProductCard
 * =====================================================================
 */

export async function generateStaticParams() {
  try {
    const ids = await productService.getCategoryIds();
    if (ids.length === 0) {
      return [{ id: "fallback" }];
    }
    return ids.map((id) => ({ id }));
  } catch (error) {
    console.warn("Failed to generate category static params:", error);
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
    categoryId: id,
    limit: 1,
  });

  const categoryName = products?.data?.[0]?.category?.name || "Category";

  return {
    title: `${categoryName} | Luxe`,
    description: `Explore all products from ${categoryName}.`,
  };
}

/**
 * =================================================================================================
 * CATEGORY PRODUCTS PAGE - DANH SÁCH SẢN PHẨM THEO DANH MỤC
 * =================================================================================================
 *
 * 📚 GIẢI THÍCH CHO THỰC TẬP SINH:
 *
 * 1. SERVER-SIDE DATA FETCHING:
 *    - `productService.getProducts`: Fetch dữ liệu trực tiếp tại Server.
 *    - `limit: 100`: Tạm thời lấy tối đa 100 sản phẩm để hiện thị nhanh (có thể nâng cấp lên phân trang).
 *
 * 2. IMAGE RESOLUTION LOGIC:
 *    - Giải quyết sự khác biệt giữa kiểu dữ liệu `string` và `object` (có `url`) của mảng ảnh.
 *    - Fallback về ảnh SKU nếu ảnh sản phẩm chính bị thiếu.
 *
 * 3. DYNAMIC METADATA:
 *    - `generateMetadata` lấy tên danh mục từ sản phẩm đầu tiên của mảng để gán vào thẻ `<title>`.
 * =================================================================================================
 */
export default async function CategoryProductsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [products, t] = await Promise.all([
    productService.getProducts({
      categoryId: id,
      limit: 100,
    }),
    getTranslations("common"),
  ]);

  const categoryName = products?.data?.[0]?.category?.name || "Category";

  return (
    <div className="min-h-screen bg-background pt-24 pb-16">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="mb-10">
          <Link
            href="/categories"
            className="text-accent hover:underline mb-4 inline-flex items-center gap-2 text-sm font-medium"
          >
            ← {t("backToCategories")}
          </Link>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mt-4">
            <div>
              <span className="text-accent font-black uppercase tracking-[0.3em] text-[10px]">
                {t("ourCollection")}
              </span>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tighter mt-1">
                {categoryName}
              </h1>
            </div>
            <p className="text-muted-foreground text-lg">
              {t("productsFound", { count: products.data.length })}
            </p>
          </div>
          <div className="w-24 h-1 bg-accent/40 rounded-full mt-4" />
        </div>

        {/* Products Grid */}
        {products.data.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
            {products.data.map((product) => {
              const imageUrl =
                (typeof product.images?.[0] === "string"
                  ? product.images?.[0]
                  : product.images?.[0]?.url) ||
                product.skus?.[0]?.imageUrl ||
                "";

              return (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  name={product.name}
                  price={Number(product.skus?.[0]?.price || 0)}
                  originalPrice={
                    product.skus?.[0]?.originalPrice
                      ? Number(product.skus?.[0]?.originalPrice)
                      : undefined
                  }
                  imageUrl={imageUrl}
                  category={product.category?.name}
                  skus={product.skus}
                  options={product.options}
                />
              );
            })}
          </div>
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
