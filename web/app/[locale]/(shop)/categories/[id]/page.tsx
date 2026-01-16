import { CollectionContent } from "@/features/products/components/collection-content";
import { getTranslations } from "next-intl/server";

export async function generateStaticParams() {
  try {
    const { getCategoryIdsAction } = await import("@/features/products/actions");
    const ids = await getCategoryIdsAction();
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
  const { getProductsAction } = await import("@/features/products/actions");
  const productsRes = await getProductsAction({
    categoryId: id,
    limit: 1,
  });

  const categoryName = productsRes.success && productsRes.data?.data?.[0]?.category?.name || "Category";

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

  // Parallel fetch: get name for the UI, and promise for the grid - Using Server Actions
  const { getCategoryAction, getProductsAction } = await import("@/features/products/actions");
  const [categoryRes, t] = await Promise.all([
    getCategoryAction(id),
    getTranslations("common"),
  ]);

  const productsPromise = getProductsAction({
    categoryId: id,
    limit: 20,
  }).then((res) => ({
    data: res.success && res.data ? res.data.data : [],
    meta: res.success && res.data ? res.data.meta : { page: 1, limit: 20, total: 0, lastPage: 1 },
  }));

  const categoryName = categoryRes.success && categoryRes.data ? categoryRes.data.name : "Category";

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
