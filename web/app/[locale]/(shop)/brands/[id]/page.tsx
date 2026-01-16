import { CollectionContent } from "@/features/products/components/collection-content";
import { getTranslations } from "next-intl/server";

export async function generateStaticParams() {
  try {
    const { getBrandIdsAction } = await import("@/features/products/actions");
    const ids = await getBrandIdsAction();
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
  const { getProductsAction } = await import("@/features/products/actions");
  const productsRes = await getProductsAction({
    brandId: id,
    limit: 1,
  });

  const brandName = productsRes.success && productsRes.data?.data?.[0]?.brand?.name || "Brand";

  return {
    title: brandName,
    description: `Explore all products from ${brandName}.`,
  };
}

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
  const limit = 20;

  // Parallel fetch: get brand details and products promise - Using Server Actions
  const { getBrandAction, getProductsAction } = await import("@/features/products/actions");
  const [brandRes, t] = await Promise.all([
    getBrandAction(id),
    getTranslations("common"),
  ]);

  const productsPromise = getProductsAction({
    brandId: id,
    limit,
    page,
  }).then((res) => ({
    data: res.success && res.data ? res.data.data : [],
    meta: res.success && res.data ? res.data.meta : { page: 1, limit: 20, total: 0, lastPage: 1 },
  }));

  const brandName = brandRes.success && brandRes.data ? brandRes.data.name : "Brand";

  return (
    <CollectionContent
      title={brandName}
      collectionLabel={t("luxuryPartners")}
      backLabel={t("backToBrands")}
      backHref="/brands"
      productsPromise={productsPromise.then((res) => ({
        data: res.data || [],
        meta: res.meta || { page: 1, limit: 20, total: 0, lastPage: 1 },
      }))}
      breadcrumbItems={[
        { label: t("brands"), href: "/brands" },
        { label: brandName },
      ]}
    />
  );
}
