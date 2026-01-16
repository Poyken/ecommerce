import { productService } from "@/features/products/services/product.service";
import { CollectionContent } from "@/features/products/components/collection-content";
import { getTranslations } from "next-intl/server";

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
    title: categoryName,
    description: `Explore all products from ${categoryName}.`,
  };
}

export default async function CategoryProductsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Parallel fetch: get name for the UI, and promise for the grid
  const [category, t] = await Promise.all([
    productService.getCategory(id),
    getTranslations("common"),
  ]);

  const productsPromise = productService.getProducts({
    categoryId: id,
    limit: 20,
  });

  const categoryName = category?.name || "Category";

  return (
    <CollectionContent
      title={categoryName}
      collectionLabel={t("ourCollection")}
      backLabel={t("backToCategories")}
      backHref="/categories"
      productsPromise={productsPromise.then((res) => ({
        data: res.data || [],
        meta: res.meta || { page: 1, limit: 20, total: 0, lastPage: 1 },
      }))}
      breadcrumbItems={[
        { label: t("categories"), href: "/categories" },
        { label: categoryName },
      ]}
    />
  );
}
